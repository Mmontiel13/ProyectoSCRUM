const { Router } = require('express');
const router = Router();
const underscore = require('underscore');
const crypto = require('crypto');

const msj = require('../sample.json');

//Genera llaves RSA de 2048 bits
const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa',{
    modulusLength: 2048,
    publicKeyEnconding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

const llavePublica = publicKey;
const llavePrivada = privateKey;
//Función para encriptar
function encriptarMensaje(mensaje, llavePublica) {
    try {
      // Convierte el mensaje a una cadena de texto
      const mensajeString = JSON.stringify(mensaje);
      // Encripta el mensaje como una cadena de texto
      const mensajeEncriptado = crypto.publicEncrypt(
        llavePublica,
        Buffer.from(mensajeString, 'utf8')
      );
      // Devuelve el mensaje encriptado como un Buffer
      return mensajeEncriptado;
    } catch (error) {
      console.error('Error al encriptar el mensaje:', error);
      return null;
    }
  }
//Función para desencriptar
function desencriptarMensaje(mensajeEncriptado, llavePrivada) {
    try {
        const mensajeDesencriptado = crypto.privateDecrypt(
            {
                key: llavePrivada
            },
            mensajeEncriptado
        );

        // Convierte el mensaje desencriptado de Buffer a cadena de texto
        const mensajeString = mensajeDesencriptado.toString('utf8');

        // Convierte la cadena de texto a un objeto JSON si es necesario
        const mensajeJSON = JSON.parse(mensajeString);

        return mensajeJSON;
    } catch (error) {
        console.error('Error al desencriptar el mensaje:', error);
        return null;
    }
}
//Routes
router.get('/msj', (req, res) => {
    const mensajesDesencriptados = msj.map((mensajeEncriptado) => {
        const mensajeDesencriptado = desencriptarMensaje(mensajeEncriptado, llavePrivada);
        return mensajeDesencriptado;
    });

    res.json(mensajesDesencriptados);
});

router.post('/msj', (req, res) => {
    //Guardar mensaje
    const newMsj = {...req.body};
    const msjEncriptado = encriptarMensaje(newMsj, llavePublica);
    //console.log(msjEncriptado);
    msj.push(msjEncriptado);
    res.json(msj);
    //res.send("Mensaje enviado");
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