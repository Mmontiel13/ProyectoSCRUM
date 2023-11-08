const { Router } = require('express');
const router = Router();
const underscore = require('underscore');

const msj = require('../sample.json');

//Routes
router.get('/msj', (req, res) => {
    res.json(msj);
});

router.post('/msj', (req, res) => {
    //const { mensaje} = req.body;
    const id = msj.length + 1;
    //Guardar mensaje
    const newMsj = {...req.body, id};
    console.log(newMsj);
    msj.push(newMsj);
    res.json(msj);
    res.send("Mensaje enviado");
});

router.delete('/msj/:id', (req, res) => {
    const {id} = req.params;
    underscore.each(msj, (mensaje, i) => {
        if (mensaje.id == id){
            msj.splice(i, 1);
        }
    });
    res.send(msj);
});

module.exports = router;