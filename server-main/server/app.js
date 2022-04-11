const express = require('express');
const cookieParser = require('cookie-parser');
const { saveLog, logging } = require('./utility/logging');
const { errorHandling } = require('./utility/error/errorHandling');
const { initialize } = require('./utility/db');
const { authenticateByJWT } = require('./cms/um/jwt/compositeServices/jwt');
const {forgetMyPass} = require('./cms/um/jwt/forgetMyPass');
const cms = require('./cms/coreBizLogic/routing');
const sunyar = require('./sunyar/coreBizLogic/routing');
const {dontInjectMe} = require("./utility/fnPreventSqlInjection");
const app = express();
const port = 8080;

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser()); 

app.use(async (req, res, next) => {
    await logging(req, res, next);
    next();
});

app.use(dontInjectMe);

app.use(async (req, _, next) => { await authenticateByJWT(req, _, next) });
app.use(async (req, _, next) => { await forgetMyPass(req, _, next) });

app.use('/api/cms', cms);
app.use('/api/sunyar', sunyar);


app.use((error, _req, res, next) => {
    _req.context.error = error.message;
    errorHandling(error, _req, res, next);
});
app.use(async (req, res, next) => {
    await saveLog(req, res, req.context, next);
});
initialize()
    .catch(error => { console.error(`Failed to initialize, error: ${error}`); process.exit(1); })
    .then(() => { app.listen(port, () => { console.log('Listening on port ' + port + ' ...') }); });