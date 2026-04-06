
import { db, parseRow } from './db.js';

// Internal Helper to Reindex (avoiding circular dependency)
const performReindex = async () => {
    // Re-run the save logic for ALL plans
    const plans = await db.execute('SELECT * FROM plans');
    const allPlans = plans.rows.map(parseRow);
    
    // Clear KB
    await db.execute('DELETE FROM plan_kb');
    
    const makesResult = await db.execute('SELECT * FROM car_makes');
    const modelsResult = await db.execute('SELECT * FROM car_models');
    const companiesResult = await db.execute('SELECT * FROM companies');
    const makes = makesResult.rows;
    const models = modelsResult.rows;
    const companies = companiesResult.rows;

    for (const p of allPlans) {
        const applicable = p.applicableCars || [];
        const companyName = companies.find(c => c.id === p.companyId)?.name || 'Unknown';
        const det = p.details || {};

        // Update Search Attributes
        let carIndexStr = applicable.map(c => {
            const mName = makes.find(m => m.id === c.carMakeId)?.name || '';
            const moName = models.find(m => m.id === c.carModelId)?.name || '';
            const sub = (c.subModels || []).join(' ');
            return `${mName} ${moName} ${sub}`;
        }).join(' ');
        
        const searchable = [
            p.planName,
            companyName,
            det.repairType === 'MALL' ? 'ซ่อมห้าง ซ่อมศูนย์' : 'ซ่อมอู่',
            carIndexStr,
            ...(det.otherServices || []),
            ...(det.additionalCoverages?.map(c => c.name) || []),
            ...(det.mainCustomCoverages?.map(c => c.name) || [])
        ].join(' ').toLowerCase();

        // Update Plan
        await db.execute({
            sql: 'UPDATE plans SET searchable_attributes = ? WHERE id = ?',
            args: [searchable, p.id]
        });

        // Insert into Comprehensive KB
        const features = [
            ...(det.otherServices || []),
            ...(det.additionalCoverages?.map(c => c.name) || []),
            ...(det.mainCustomCoverages?.map(c => c.name) || [])
        ].join(', ');

        for (const c of applicable) {
            const makeName = makes.find(m => m.id === c.carMakeId)?.name || '';
            const modelName = models.find(m => m.id === c.carModelId)?.name || 'ALL';
            const kbId = `${p.id}_${c.id || Math.random()}`;

            await db.execute({
                sql: `INSERT INTO plan_kb (
                    id, planId, planName, companyName, makeName, modelName, sub_models, yearMin, yearMax, price, planType, repairType,
                    sumInsured, deductible, fireTheft, floodCoverage,
                    tpProperty, tpPerson, tpTime,
                    paDriver, paPassenger, medicalExp, bailBond,
                    emergencyService, coverage_features
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                args: [
                    kbId, p.id, p.planName, companyName,
                    makeName, modelName, 
                    JSON.stringify(c.subModels || []),
                    c.yearMin, c.yearMax,
                    p.price, p.type, det.repairType || 'GARAGE',
                    
                    det.sumInsured || 0,
                    det.deductible || 0,
                    det.fireTheft || 0,
                    det.floodCoverage || 0,
                    det.thirdPartyProperty || 0,
                    det.thirdPartyPerson || 0,
                    det.thirdPartyTime || 0,
                    det.paDriver || 0,
                    det.paPassenger || 0,
                    det.medicalExp || 0,
                    det.bailBond || 0,
                    det.emergencyService ? 1 : 0,
                    features
                ]
            });
        }
    }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
        try {
            const rs = await db.execute('SELECT * FROM plans');
            res.status(200).json(rs.rows.map(parseRow));
        } catch (dbError) {
             if (dbError.message && (dbError.message.includes('no such table') || dbError.message.includes('SQLITE_ERROR'))) {
                return res.status(200).json([]);
            }
            throw dbError;
        }
    } else if (req.method === 'POST') {
        const { action, plan, id, criteria } = req.body;
        
        if (action === 'SEARCH') {
            // --- SERVER-SIDE SEARCH ENGINE USING PLAN_KB ---
            const { make, model, year, filters } = criteria;
            
            let sql = `
                SELECT DISTINCT p.* 
                FROM plans p 
                JOIN plan_kb k ON p.id = k.planId 
                WHERE 1=1
            `;
            const args = [];

            // 1. Car Matching (Logic: Match Specific or 'ALL')
            // FIX: Ignore spaces for robust matching (e.g. "Model Y" vs "ModelY")
            if (make) {
                sql += ` AND (REPLACE(LOWER(k.makeName), ' ', '') = REPLACE(LOWER(?), ' ', '') OR k.makeName = 'ALL')`;
                args.push(make);
            }
            
            if (model) {
                // Approximate match for model to handle "Yaris Ativ" vs "Yaris" and "Model Y" vs "ModelY"
                sql += ` AND (REPLACE(LOWER(k.modelName), ' ', '') LIKE REPLACE(LOWER(?), ' ', '') OR k.modelName = 'ALL')`;
                args.push(`%${model}%`);
            }

            if (year) {
                const y = parseInt(year);
                if (!isNaN(y)) {
                    sql += ` AND (? BETWEEN k.yearMin AND k.yearMax)`;
                    args.push(y);
                }
            }

            // 2. Filter Logic
            if (filters) {
                // Price (Premium) Limit
                if (filters.maxPrice) {
                    sql += ` AND k.price <= ?`;
                    args.push(filters.maxPrice);
                }
                
                // Sum Insured (Coverage Amount)
                if (filters.minSumInsured) {
                    sql += ` AND k.sumInsured >= ?`;
                    args.push(filters.minSumInsured);
                }

                // Plan Type (Strict string match from normalized filter)
                if (filters.planType) {
                    // Remove spaces for comparison (e.g. "ชั้น 1" vs "ชั้น1")
                    sql += ` AND REPLACE(k.planType, ' ', '') = REPLACE(?, ' ', '')`;
                    args.push(filters.planType);
                }

                // Company
                if (filters.companyKeyword) {
                    sql += ` AND k.companyName LIKE ?`;
                    args.push(`%${filters.companyKeyword}%`);
                }

                // Attributes Map to Columns (BILINGUAL SUPPORT)
                if (filters.attributes && filters.attributes.length > 0) {
                    for (const attr of filters.attributes) {
                        switch (attr) {
                            case 'no_deductible':
                                sql += ` AND k.deductible = 0`;
                                break;
                            case 'mall_repair':
                                sql += ` AND k.repairType = 'MALL'`;
                                break;
                            case 'garage_repair':
                                // If asking for Garage, strictly show Garage
                                sql += ` AND k.repairType = 'GARAGE'`; 
                                break;
                            case 'flood_coverage':
                                sql += ` AND k.floodCoverage > 0`;
                                break;
                            case 'emergency_service':
                                sql += ` AND k.emergencyService = 1`;
                                break;
                            case 'fire_theft_coverage':
                                sql += ` AND k.fireTheft > 0`;
                                break;
                            case 'replacement_car':
                                // Check text blob for both Thai and English terms
                                sql += ` AND (k.coverage_features LIKE '%รถใช้%' OR k.coverage_features LIKE '%replacement%' OR k.coverage_features LIKE '%courtesy%')`;
                                break;
                            case 'windshield_coverage':
                                sql += ` AND (k.coverage_features LIKE '%กระจก%' OR k.coverage_features LIKE '%windshield%')`;
                                break;
                            case 'towing_service':
                                sql += ` AND (k.coverage_features LIKE '%รถยก%' OR k.coverage_features LIKE '%ลาก%' OR k.coverage_features LIKE '%towing%')`;
                                break;
                            case 'battery_service':
                                sql += ` AND (k.coverage_features LIKE '%แบต%' OR k.coverage_features LIKE '%battery%')`;
                                break;
                            case 'tire_service':
                                sql += ` AND (k.coverage_features LIKE '%ยาง%' OR k.coverage_features LIKE '%tire%')`;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }

            sql += ` ORDER BY p.price ASC LIMIT 20`; // Limit for performance

            try {
                let result = await db.execute({ sql, args });
                
                // --- AUTO-FIX: IF RESULT IS EMPTY, CHECK IF PLAN_KB IS EMPTY ---
                if (result.rows.length === 0) {
                    try {
                        const check = await db.execute('SELECT count(*) as count FROM plan_kb');
                        if (check.rows[0].count === 0) {
                            console.log("⚠️ Search returned 0 and Plan KB is empty. Triggering Auto-Reindex...");
                            await performReindex();
                            // Retry search
                            result = await db.execute({ sql, args });
                        }
                    } catch(tableError) {
                        // Ignore table error, it implies DB not setup, returns empty anyway
                    }
                }
                
                res.status(200).json(result.rows.map(parseRow));
            } catch (e) {
                console.error("Search Query Error:", e);
                // Fallback: return empty
                res.status(200).json([]);
            }

        } else if (action === 'SAVE') {
             // Validate and sanitize
             if (!plan || !plan.id) throw new Error("Invalid plan data");
             
             const details = plan.details || {};
             const applicableCars = plan.applicableCars || [];

             // --- ENHANCED SEARCH INDEXING ---
             // Fetch Make/Model/Company names
             let carIndexStr = '';
             let companyName = '';
             try {
                const makesResult = await db.execute('SELECT * FROM car_makes');
                const modelsResult = await db.execute('SELECT * FROM car_models');
                const companiesResult = await db.execute('SELECT * FROM companies');
                const makes = makesResult.rows;
                const models = modelsResult.rows;
                const companies = companiesResult.rows;

                companyName = companies.find(c => c.id === plan.companyId)?.name || 'Unknown';

                const carTexts = applicableCars.map(c => {
                    const mName = makes.find(m => m.id === c.carMakeId)?.name || '';
                    const moName = models.find(m => m.id === c.carModelId)?.name || '';
                    const sub = (c.subModels || []).join(' ');
                    return `${mName} ${moName} ${sub}`;
                });
                carIndexStr = carTexts.join(' ');
             } catch(e) { console.warn("Index Gen Warn:", e); }

             const searchableTexts = [
                plan.planName || '',
                companyName,
                details.repairType === 'MALL' ? 'ซ่อมห้าง ซ่อมศูนย์' : 'ซ่อมอู่',
                carIndexStr, 
                ...(details.otherServices || []),
                ...(details.additionalCoverages?.map(c => c.name) || []),
                ...(details.mainCustomCoverages?.map(c => c.name) || [])
             ];
             const searchable_attributes = searchableTexts.join(' ').toLowerCase();

             // Ensure no undefined values
             const safePlan = {
                 id: plan.id,
                 agentId: plan.agentId || null,
                 companyId: plan.companyId || null,
                 planName: plan.planName || '',
                 type: plan.type || '',
                 price: plan.price || 0,
                 status: plan.status || 'ACTIVE',
                 isHotDeal: plan.isHotDeal ? 1 : 0,
                 createdAt: plan.createdAt || new Date().toISOString(),
                 details: JSON.stringify(details),
                 applicableCars: JSON.stringify(applicableCars),
                 sumInsured: details.sumInsured || 0,
                 deductible: details.deductible || 0,
                 repairType: details.repairType || 'GARAGE',
                 emergencyService: details.emergencyService ? 1 : 0,
                 floodCoverage: details.floodCoverage || 0,
                 searchable_attributes: searchable_attributes
             };

             // 1. Save to Plans Table
             await db.execute({
                sql: `INSERT OR REPLACE INTO plans 
                      (id, agentId, companyId, planName, type, price, status, isHotDeal, createdAt, details, applicableCars, sumInsured, deductible, repairType, emergencyService, floodCoverage, searchable_attributes) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    safePlan.id, safePlan.agentId, safePlan.companyId, safePlan.planName, safePlan.type, safePlan.price, safePlan.status, safePlan.isHotDeal, safePlan.createdAt, safePlan.details, safePlan.applicableCars,
                    safePlan.sumInsured, safePlan.deductible, safePlan.repairType, safePlan.emergencyService, safePlan.floodCoverage, safePlan.searchable_attributes
                ]
            });

            // 2. Populate COMPREHENSIVE PLAN_KB
            try {
                await db.execute({ sql: 'DELETE FROM plan_kb WHERE planId = ?', args: [safePlan.id] });
                
                // Fetch Master Data again (safe due to local scope usually, but for consistency)
                const makesResult = await db.execute('SELECT * FROM car_makes');
                const modelsResult = await db.execute('SELECT * FROM car_models');
                const makes = makesResult.rows;
                const models = modelsResult.rows;

                // Build Feature String for KB
                const features = [
                    ...(details.otherServices || []),
                    ...(details.additionalCoverages?.map(c => c.name) || []),
                    ...(details.mainCustomCoverages?.map(c => c.name) || [])
                ].join(', ');

                for (const criteria of applicableCars) {
                    const makeName = makes.find(m => m.id === criteria.carMakeId)?.name || '';
                    const modelName = models.find(m => m.id === criteria.carModelId)?.name || 'ALL';
                    const kbId = `${safePlan.id}_${criteria.id || Date.now()}_${Math.random()}`;

                    await db.execute({
                        sql: `INSERT INTO plan_kb (
                            id, planId, planName, companyName, makeName, modelName, sub_models, yearMin, yearMax, price, planType, repairType,
                            sumInsured, deductible, fireTheft, floodCoverage,
                            tpProperty, tpPerson, tpTime,
                            paDriver, paPassenger, medicalExp, bailBond,
                            emergencyService, coverage_features
                        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        args: [
                            kbId, safePlan.id, safePlan.planName, companyName,
                            makeName, modelName, 
                            JSON.stringify(criteria.subModels || []),
                            criteria.yearMin, criteria.yearMax,
                            safePlan.price, safePlan.type, safePlan.repairType,
                            
                            details.sumInsured || 0,
                            details.deductible || 0,
                            details.fireTheft || 0,
                            details.floodCoverage || 0,
                            details.thirdPartyProperty || 0,
                            details.thirdPartyPerson || 0,
                            details.thirdPartyTime || 0,
                            details.paDriver || 0,
                            details.paPassenger || 0,
                            details.medicalExp || 0,
                            details.bailBond || 0,
                            details.emergencyService ? 1 : 0,
                            features
                        ]
                    });
                }
            } catch (kbError) {
                console.warn("Plan KB Update Failed:", kbError);
            }

            res.status(200).json({ success: true });

        } else if (action === 'DELETE') {
            await db.execute({ sql: 'DELETE FROM plans WHERE id = ?', args: [id] });
            try { await db.execute({ sql: 'DELETE FROM plan_kb WHERE planId = ?', args: [id] }); } catch(e){}
            res.status(200).json({ success: true });
        
        } else if (action === 'REINDEX') {
            await performReindex();
            res.status(200).json({ success: true });
        }
    }
  } catch (error) {
    console.error("Plans API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
