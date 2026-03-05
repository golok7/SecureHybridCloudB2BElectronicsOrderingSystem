const forge = require('node-forge');
const fs = require('fs');

const pki = forge.pki;
const keys = pki.rsa.generateKeyPair(2048);
const cert = pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{ name: 'commonName', value: 'localhost' }];
cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.sign(keys.privateKey, forge.md.sha256.create());

const pemCert = pki.certificateToPem(cert);
const pemKey = pki.privateKeyToPem(keys.privateKey);

fs.writeFileSync('cert.pem', pemCert);
fs.writeFileSync('key.pem', pemKey);

console.log('Certificates successfully generated.');
