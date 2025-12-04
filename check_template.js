const axios = require('axios');

const ALIGO_APIKEY = 'qyaz1cwfldsvmde36i6345jsfwmei4y7';
const ALIGO_USERID = 'nsc21';
const ALIGO_SENDERKEY = '34e353e21a3ebc567c9df3bc527768d93ace882b';
const ALIGO_TPL_CODE = 'UD_9510';

async function checkTemplate() {
    try {
        const params = new URLSearchParams({
            'apikey': ALIGO_APIKEY,
            'userid': ALIGO_USERID,
            'senderkey': ALIGO_SENDERKEY,
            'tpl_code': ALIGO_TPL_CODE
        });

        const response = await axios.post('https://kakaoapi.aligo.in/akv10/template/list/', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTemplate();
