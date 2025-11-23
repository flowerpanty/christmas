function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
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

    return ContentService.createTextOutput(JSON.stringify({ 
      'result': 'success' 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      'result': 'error', 
      'error': error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
