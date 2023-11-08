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
    const {mensajeComprimido, tablaCompresion} = comprimirMensaje(mensaje);
        //Combina el mensaje comprimido y la tabla en un objeto
        const msjAEncriptar = {mensajeComprimido, tablaCompresion};
      // Convierte el mensaje a una cadena de texto
      const mensajeString = JSON.stringify(msjAEncriptar);
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
//Compresión de longitud variable y genera una tabla
function comprimirMensaje(mensaje) {
    const tablaCompresion = {}; // Objeto para almacenar la tabla de compresión
    let codigoActual = 0; // Código actual para asociar con secuencias de caracteres

    // Función para agregar una entrada en la tabla
    function agregarEntrada(secuencia) {
        tablaCompresion[secuencia] = codigoActual;
        codigoActual++;
    }

    let mensajeComprimido = [];
    let secuenciaActual = ''; // Secuencia actual que se está construyendo

    for (let i = 0; i < mensaje.length; i++) {
        secuenciaActual += mensaje[i];
        if (!tablaCompresion[secuenciaActual]) {
            // La secuencia no existe en la tabla, la agregamos
            agregarEntrada(secuenciaActual.substring(0, secuenciaActual.length - 1));
            mensajeComprimido.push(tablaCompresion[secuenciaActual.substring(0, secuenciaActual.length - 1)]);
            secuenciaActual = mensaje[i];
        }
    }

    // Agregamos la última secuencia
    agregarEntrada(secuenciaActual);

    return { mensajeComprimido, tablaCompresion };
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