const express = require('express');
const app = express()

const dbrequest = require('./dbrequest')
const SSEClient = require('./models/SSEClient');
const config = require('./config')

const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'API pour l\'application de monitoring',
            description: 'Pour pouvoir avoir accès aux routes, il faut que l\'application WEB soit connectée à la base de données des logs.',
            contact: {
                name: 'Dyctimatec'
            },
            servers: ["http://192.168.1.87:3500/"]
        }
    },
    // [".routes/*.js"]
    apis: ["app.js"]
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs))


// Middleware pour autoriser les connexions
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});
app.use(express.json());

//app.get('/api/connect', (req, res, next) => {
    
    config.setMssqlConfig().then((data) => {

  
        let port

       data[0].dbport == 'na' ? port = null : port = parseInt(data[0].dbport)


        const sqlConfig = {

            "user": data[0].dbuser,
            "password": data[0].dbpassword,
            "server": data[0].dbhost,
            "database": data[0].dbname,
            "port": port,
            "options": {
                "encrypt": true,
                "trustServerCertificate": true
            }
        }


           
        /**
         * @swagger
         * /api/connect:
         *  get:
         *      description: Récupères tous les jobs
         *      responses:
         *          '200':
         *              description: JSON response
         */
        app.get('/api/connect', (req, res, next) => {
            dbrequest.tryConnection(sqlConfig)
            .then(result => {
                let isConnected = result.isConnected
                if (isConnected) {
                    res.status(200).json({
                        connected: isConnected,
                        connectionId: data[0].id,
                        host: data[0].dbhost
                    })
                } else {
                    res.status(200).json({
                        connected: isConnected,
                        connectionId: data[0].id
                    })
                }
            })
        })

        //Retourne toutes les logs
        /**
         * @swagger
         * /api/jobs:
         *  get:
         *      description: Récupères tous les jobs
         *      responses:
         *          '200':
         *              description: JSON response
         */
        app.get('/api/jobs', (req, res, next) => {

            dbrequest.getAllJob(sqlConfig).then(results => {
                res.status(200).send(results)
                res.end()
            }).catch(err => {
              console.log(err)
            })
        })



        //Retourne toutes les logs par status
        /**
         * @swagger
         * /api/:status/jobs:
         *  get:
         *      description: Récupères tous les jobs par type de status
         *      parameters:
         *       - in: path
         *         name: status
         *         required: true
         *         description: Numeric ID (5;7;1;3).
         *         schema:
         *           type: integer
         *      responses:
         *          '200':
         *              description: JSON response
         */
        app.get('/api/:status/jobs/', (req, res, next) => {

            dbrequest.getJobByStatus(sqlConfig, req.params.status).then(results => {
                res.status(200).send(results)
                //console.log(results)
            }).catch(err => {
                console.log(err)
            })
        })

        //Retourne les informations d'une log
        /**
         * @swagger
         * /api/:idJob/job:
         *  get:
         *      description: Récupère toutes les informations d'une log à partir de son ID
         *      parameters:
         *       - in: path
         *         name: idJob
         *         required: true
         *         description: Numeric ID of the log to retrieve.
         *         schema:
         *           type: integer
         *      responses:
         *          '200':
         *              description: JSON response
         */
        app.get('/api/:idJob/job', (req, res, next) => {

            dbrequest.getJobById(sqlConfig, req.params.idJob).then(results => {
                res.status(200).send(results)
                //console.log(results)
            }).catch(err => {
                console.log(err)
            })
        })

        //Supprime une log
        /**
         * @swagger
         * /api/:id/job:
         *  delete:
         *      description: Supprime un job avec un id donnée
         *      parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         description: Numeric ID.
         *         schema:
         *           type: integer
         *      responses:
         *          '200':
         *              description: JSON response
         */
        app.delete('/api/:id/job', (req, res, next) => {

            dbrequest.deleteLog(sqlConfig, req.params.id).then(result => {
                if (result) {
                    res.status(200).send("Supprimé")
                } else {
                    res.status(200).send("Erreur lors de la suppression")
                }
            }).catch(err => {
                console.log(err)
            })
        })


        /**
         * @swagger
         * /api/jobs/count:
         *  get:
         *      description: Compte tous les jobs par type
         *      responses:
         *          '200':
         *              description: JSON response
         */
        app.get('/api/jobs/count', (req, res, next) => {

            dbrequest.getCount(sqlConfig).then(results => {
                res.status(200).send(results)
            }).catch(err => {
                console.log(err)
            })
        })


        app.get('/stream/jobs/count', async (req, res) => {
            /* On crée notre client */
            const client = new SSEClient(res);

            /* On initialise la connexion */
            client.initialize();
    
            sendCount(client,sqlConfig)

            

        })


        const sendCount = (client, sqlConfig) => {

            dbrequest.getCount(sqlConfig).then(results => {

                client.send({ id: Date.now, type: 'message', data: results});

            }).catch(err => {
                console.log(err)
            })

            config.getRefeshTime().then( (frequency) => {
                setTimeout(
                    () => {
                        sendCount(client, sqlConfig)
                    }, frequency
                )
            })
        }  
    })  
//})


// Export du module
module.exports = app;