const { Router } = require('express');
const router = Router();
const crypto = require('crypto');

let messagesStorage = require('../sample.json');

//Generates an 2048-bits RSA key
const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa',{
    modulusLength: 2048,
    publicKeyEncoding: {
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

// comprimirMensaje creates a tablaCompresion which is a compression table that
// late will be used to decrypt the message
function comprimirMensaje(mensaje) {
    const tablaCompresion = {};
    let codigoActual = 1; // Start from 1 because 0 is reserved for unknown sequences

    function agregarEntrada(secuencia) {
        if (!tablaCompresion[secuencia]) {
            tablaCompresion[secuencia] = codigoActual;
            codigoActual++;
        }
    }

    let mensajeComprimido = [];

    for (let i = 0; i < mensaje.length; i++) {
        agregarEntrada(mensaje[i]);
        mensajeComprimido.push(tablaCompresion[mensaje[i]]);
    }

    return { mensajeComprimido, tablaCompresion };
}

// descomprimirMensaje recieves the compressed message  and the tablaCompresion
function descomprimirMensaje(mensajeComprimido, tablaCompresion) {
    const tablaDescompresion = Object.fromEntries(
        Object.entries(tablaCompresion).map(([key, value]) => [value, key])
    );

    const mensajeDescomprimido = mensajeComprimido.map(code => tablaDescompresion[code]).join('');

    return mensajeDescomprimido;
}


// encriptarMensaje creates an object with the compressed message and the tablaCompresion
function encriptarMensaje(message, publicKey) {
    const { mensajeComprimido, tablaCompresion } = comprimirMensaje(message);
    console.log('mensajeComprimido:', mensajeComprimido);
    console.log('tablaCompresion:', tablaCompresion);
    const buffer = Buffer.from(mensajeComprimido);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return { encrypted: Array.from(encrypted), tablaCompresion };
}

// desencriptarMensaje recieves the encrypted message, the private key and the tablaCompresion
// and uses the tablaCompresion to decrypt the message
function desencriptarMensaje(encryptedMessage, privateKey, compressionTable) {
    const buffer = Buffer.from(encryptedMessage);
    const decryptedCompressedMessage = crypto.privateDecrypt(privateKey, buffer);
    const originalMessage = descomprimirMensaje(Array.from(decryptedCompressedMessage), compressionTable);
    return originalMessage;
}



// receives the messagesStorages array and uses desencriptarMensaje to decrypt the message
// and shows it to the client
router.get('/msj/:id', (req, res) => {
    const id = Number(req.params.id);
    const messages = messagesStorage.filter(msg => msg.recipientID === id);
    if (!messages.length) {
        res.status(404).send('Messages not found');
        return;
    }
    messages.forEach(message => {
        if (message.decompressed) {
            res.status(403).send('Message has already been decompressed');
            return;
        }
        try {
            message.originalMessages = desencriptarMensaje(message.encrypted, llavePrivada, message.tablaCompresion);
            message.decompressed = true;
            console.log('originalMessages:', message.originalMessages);
        } catch (error) {
            console.error('Error al desencriptar/descomprimir el mensaje:', error);
            res.status(500).send('Error al desencriptar/descomprimir el mensaje');
        }
    });
    res.json(messages.map(message => message.originalMessages));
});

// pushes the object which contains the message and tablaCompresion into the messagesStorage array
let uniqueMsg_ID = 0;
router.post('/msj', (req, res) => {
    console.log(req.body);
    const recipID = req.body.recipientID;
    const { encrypted, tablaCompresion } = encriptarMensaje(req.body.Mensaje, llavePublica);
    if (!tablaCompresion) {
        res.status(500).send('Error al comprimir el mensaje');
        return;
    }
    const newMessage = { idMsg: uniqueMsg_ID++,encrypted, tablaCompresion, recipientID: recipID, decompressed: false };
    messagesStorage.push(newMessage);
    res.json(newMessage);
});

router.delete('/msj/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = msj.length;
    msj = msj.filter((mensaje) => mensaje.id != id);

    if (msj.length === initialLength) {
        res.status(404).send('Message with the given ID was not found.');
    } else {
        res.send(msj);
    }
});

module.exports = router;
