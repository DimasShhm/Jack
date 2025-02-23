const { chromium } = require('playwright');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let browser, context, page;

async function startBrowser() {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('https://web.whatsapp.com');
}

async function generateQRCode() {
    await page.waitForSelector('canvas[aria-label="Scan me!"]', { timeout: 60000 });
    const qrCodeCanvas = await page.$('canvas[aria-label="Scan me!"]');
    const qrCodeDataUrl = await qrCodeCanvas.toDataURL();
    const qrCodeData = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    qrcode.generate(qrCodeData, { small: true });
}

async function handleMessage(msg) {
    if (msg.startsWith('!pay ')) {
        const args = msg.split(' ');
        const amount = args[1];
        const paymentMethod = args[2]?.toLowerCase();

        if (!amount || isNaN(amount)) {
            console.log('Please specify a valid amount.');
            return;
        }

        if (!paymentMethod || !['dana', 'gopay', 'ovo'].includes(paymentMethod)) {
            console.log('Please specify a valid payment method (dana, gopay, ovo).');
            return;
        }

        let paymentNumber;
        let qrCodePath;
        switch (paymentMethod) {
            case 'dana':
                paymentNumber = '081234567890'; // Replace with your actual DANA number
                qrCodePath = path.join(__dirname, 'dana-qr-code.png');
                break;
            case 'gopay':
                paymentNumber = '081234567891'; // Replace with your actual GoPay number
                qrCodePath = path.join(__dirname, 'gopay-qr-code.png');
                break;
            case 'ovo':
                paymentNumber = '081234567892'; // Replace with your actual OVO number
                qrCodePath = path.join(__dirname, 'ovo-qr-code.png');
                break;
        }

        const paymentDetails = `You have requested a payment of ${amount} units using ${paymentMethod.toUpperCase()}. Please proceed with the payment to the following number: ${paymentNumber}.`;
        console.log(paymentDetails);

        // Send the QR code image if it exists
        if (fs.existsSync(qrCodePath)) {
            console.log(`Sending QR code image from ${qrCodePath}`);
        } else {
            console.log('Sorry, the QR code image is not available.');
        }

        // Log payment request
        fs.appendFile('payments.log', `${new Date().toISOString()} - Requested payment of ${amount} units using ${paymentMethod.toUpperCase()} to number ${paymentNumber}\n`, err => {
            if (err) throw err;
        });
    }
}

async function main() {
    await startBrowser();
    await generateQRCode();

    // Simulate receiving a message
    setTimeout(() => {
        handleMessage('!pay 10000 gopay');
    }, 60000); // Wait for 1 minute to simulate QR code scan and WhatsApp Web login
}

main().catch(console.error);