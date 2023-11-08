const express = require('express');
const app = express();
const morgan = require('morgan');

//Settings
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);
//Ver peticiones en consola (simple)
app.use(morgan('dev'));
//Entender inputs de formularios
app.use(express.urlencoded({extended: false}));
//Recibir y entender JSON
app.use(express.json());
//Routes
app.use('/api/',require('./routes/index'));



//Setting up el server
app.listen(app.get('port'), () =>{
    console.log(`API de Patito S.A. en ejecución en el puerto ${app.get('port')}`);
});