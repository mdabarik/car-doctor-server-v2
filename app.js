const jwt = require('jsonwebtoken');

const user = {
    name: 'Md. A. Barik',
    email: 'mdabarik.dollar@gmail.com'
}

const secret = "468353f01412e4dbb0be12a53b4b3ee0a9a92491297bb66301bb42613ec8f2a1e7915937e6bec94db52c5536dea58fd423554018debc8ba60c6a5f1df749b49d";
const token = jwt.sign(user, secret, { expiresIn: '24h' })
console.log(token);

const getToken = token;
jwt.verify(getToken, secret, (err, decoded) => {
    console.log('decoded:', decoded);
})
