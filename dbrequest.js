const sql = require('mssql')
const queries = require('./query.json')




async function tryConnection(sqlConfig) {


    return new Promise(async (resolve,reject) => {
        let isConnected = true
        new sql.ConnectionPool(sqlConfig).connect()
        .then(() => {
            resolve(isConnected)
        })
        .catch(() => {
            isConnected = false
            reject(isConnected)
            console.log('Database Connection Failed! Bad Config: ')
        })
    })
    .then(isConnected => { return {"isConnected": isConnected} })
    .catch(isConnected => { 
        sql.close() 
        return {"isConnected": isConnected}
    })   
}


async function getAllJob(sqlConfig) {
    try {
        
        let pool = await sql.connect(sqlConfig)
        let result = await pool.request().query(queries.findAll)
        //let result = await pool.request().query("SELECT * FROM Job ORDER BY PK_Job DESC OFFSET 0 ROWS FETCH FIRST 10 ROW ONLY")
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function getJobByStatus(sqlConfig, statusID) {

    try {
        let pool = await sql.connect(sqlConfig)
  
        let result = await pool.request().query(queries.findByStatus + statusID)
        
        return result.recordsets[0]
                
    } catch (error) {
        console.log(error)
    }
}

async function getJobById(sqlConfig, id) {

    try {
        let pool = await sql.connect(sqlConfig)
        let result = await pool.request().query(queries.find + id)
        return result.recordsets[0]
    } catch (error) {
        console.log(error)
    }
}

async function deleteLog(sqlConfig, id) {

    try {
        let pool = await sql.connect(sqlConfig)
        //await pool.request().query("DELETE FROM jobinfo WHERE FK_Job = " + id)
        await pool.request().query(queries.deleteJob + id)
        await pool.request().query(queries.deleteInfo + id)

        return true

    } catch (error) {
       console.log(error)// return false
    }
}

async function getCount(sqlConfig) {
    try {
        let pool = await sql.connect(sqlConfig)

        let failedJob = await pool.request().query(queries.count + "5")
        let breakJob = await pool.request().query(queries.count + "7")
        let programedJob = await pool.request().query(queries.count + "1")
        let successJob = await pool.request().query(queries.count + "3")

        return {
            fail: failedJob.recordsets[0][0],
            break: breakJob.recordsets[0][0],
            programed: programedJob.recordsets[0][0],
            successJob : successJob.recordsets[0][0]
        }

    } catch (error) {
        console.log(error)
    }
}


module.exports = {
    getAllJob: getAllJob,
    tryConnection: tryConnection,
    getCount: getCount,
    getJobByStatus: getJobByStatus,
    getJobById: getJobById,
    deleteLog: deleteLog
}