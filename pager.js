const request = require('request');
const secrets = require('./secrets');

const sendPage = async () => {
    const pagerUrl = "https://enceledus.xmatters.com/api/integration/1/functions/f2a069d9-46f6-40c2-bfd9-fd4a3a852d15/triggers";

    const headers = {
        "Content-Type": "application/json"
    }

    const body = JSON.stringify({
        priority: "MEDIUM"
    });
    const options = {
        method: "POST",
        url: pagerUrl,
        headers,
        body,
        auth: {
            user: secrets.xm.user,
            password: secrets.xm.pass
        }
    }

    request(options, (err, res) => {
        if(err) console.error(err);
        console.log(res.body);
        return;
    })
}

module.exports = { sendPage };