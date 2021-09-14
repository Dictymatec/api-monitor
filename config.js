const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'lasernet',
  password: 'root',
  database: 'paramDB',
  port: 3306
  
});

const setMssqlConfig = () => {
    return new Promise( (resolve,reject) => {
        let sql = 'SELECT * FROM instance WHERE isconnected = 1'
        db.query(sql, (err,results) => {
            if(err) throw err

            resolve(results)
        })    
    })
    .catch( (err) => {
        reject(err)
    })
}

const getRefeshTime = () => {
    return new Promise( (resolve,reject) => {
        let sql = 'SELECT frequency FROM actualisation WHERE id = 1'
        db.query(sql, (err,results) => {
            if(err) throw err

            resolve(results[0].frequency * 1000)
        })    
    })
    .catch( (err) => {
        reject(err)
    })
}



module.exports = {
    setMssqlConfig: setMssqlConfig,
    getRefeshTime: getRefeshTime
}