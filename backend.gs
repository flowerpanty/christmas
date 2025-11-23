// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code into Code.gs
// 4. Click Deploy > New Deployment > Select type: Web app
// 5. Set 'Execute as': Me
// 6. Set 'Who has access': Anyone
// 7. Click Deploy and copy the 'Web App URL'

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 'result': 'Please use POST' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Append Order to Sheet
    sheet.appendRow([
      new Date(),
      data.name,
      data.phone,
      data.brookie1Qty,
      data.brookie1Option,
      data.brookie2Qty,
      data.faceSetQty,
      data.totalPrice,
      data.pickupMethod,
      data.pickupDate,
      data.pickupTime,
      data.depositor,
      data.amount,
      data.memo
    ]);

    // Send Email to Customer
    // NOTE: This sends an email from YOUR Gmail account to the customer.
    // Ensure you are okay with this before deploying.
    /*
    const subject = `[NothingMatters] 주문이 접수되었습니다!`;
    const body = `
      안녕하세요 ${data.name}님!
      주문해주셔서 감사합니다.
      
      [주문 내역]
      총 금액: ${data.totalPrice}원
      입금자명: ${data.depositor}
      
      입금이 확인되면 예약이 확정됩니다.
      감사합니다. 🎄
    `;
    
    // Uncomment the line below to enable email sending
    // GmailApp.sendEmail(data.email, subject, body); 
    */

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
