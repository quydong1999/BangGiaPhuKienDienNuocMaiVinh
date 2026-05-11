import sys

with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\lib\document-service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''
export const exportDocumentToPDF = (items: CartItem[], grandTotal: number, docType: 'receipt' | 'quotation', includeVAT: boolean = false) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép trình duyệt hiển thị popup để xuất PDF.');
    return;
  }

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rowsHtml = items.map((item, index) => {
    const cleanedSpec = cleanSpecName(item.specName);
    const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
    const productName = isVisibleSpec
      ? `${item.product.name} (${cleanedSpec})`
      : item.product.name;

    const fmtNum = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
    return `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${productName}</td>
        <td class="text-center">${item.unit}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${fmtNum(item.price)}</td>
        <td class="text-right">${fmtNum(item.price * item.quantity)}</td>
      </tr>
    `;
  }).join('');

  const title = docType === 'quotation' ? 'BẢNG BÁO GIÁ' : 'PHIẾU BÁN HÀNG';
  const prefix = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  const fileName = `${prefix}_MaiVinh_${String(day).padStart(2, '0')}${String(month).padStart(2, '0')}${year}.pdf`;

  let tfootHtml = '';
  if (docType === 'quotation' && includeVAT) {
    tfootHtml = `
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">TỔNG CỘNG TRƯỚC VAT</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
      </tr>
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">VAT (8%)</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(Math.round(grandTotal * 0.08))}</td>
      </tr>
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">TỔNG CỘNG SAU VAT</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(Math.round(grandTotal * 1.08))}</td>
      </tr>
    `;
  } else {
    tfootHtml = `
      <tr style="font-weight: bold; background-color: #f2f2f2;">
        <td colspan="5" class="text-center">TỔNG CỘNG</td>
        <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
      </tr>
    `;
  }

  const finalTotal = docType === 'quotation' && includeVAT ? Math.round(grandTotal * 1.08) : Math.round(grandTotal);
  const cfg = new ReadingConfig();
  cfg.unit = ['đồng'];
  const txt = doReadNumber(String(finalTotal), cfg);
  const bangChu = txt.charAt(0).toUpperCase() + txt.slice(1);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Đang xuất PDF...</title>
      <meta charset="utf-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        body { font-family: "Times New Roman", Times, serif; padding: 0; color: #000; line-height: 1.4; background: #fff; }
        #pdf-content { padding: 40px; }
        .header-container { text-align: center; margin-bottom: 20px; }
        .store-name { font-weight: bold; text-transform: uppercase; font-size: 20px; margin-bottom: 4px; }
        .title-container { text-align: center; margin: 30px 0; }
        .title { font-size: 32px; font-weight: bold; }
        .info-section { margin-bottom: 16px; font-size: 15px; }
        .info-row { display: flex; align-items: baseline; margin-bottom: 8px; }
        .info-label { white-space: nowrap; margin-right: 4px; }
        .info-dots { flex: 1; border-bottom: 1px dotted #000; margin-bottom: 3px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 15px; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer { margin-top: 8px; display: flex; justify-content: space-between; }
        .footer-column { text-align: center; width: 280px; }
        .date { font-style: italic; margin-bottom: 10px; font-size: 15px; }
        .signature-space { height: 100px; }
      </style>
    </head>
    <body>
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: sans-serif; font-size: 18px; color: #333;">
        Đang tạo file PDF, vui lòng đợi...
      </div>
      <div id="pdf-content" style="position: absolute; left: -9999px; top: 0; width: 800px;">
        <div class="header-container">
          <div class="store-info">
            <div class="store-name">Cửa hàng Điện nước Mai Vinh</div>
            <div>Địa chỉ: Thắng Kiên - Đề Gi - Gia Lai</div>
            <div>SĐT: 0976 576 443 - 0982 390 943</div>
          </div>
        </div>

        <div class="title-container">
          <div class="title">${title}</div>
        </div>

        <div class="info-section">
          <div class="info-row"><span class="info-label">Tên khách hàng:</span><span class="info-dots"></span></div>
          <div class="info-row"><span class="info-label">Mã số thuế:</span><span class="info-dots"></span></div>
          <div class="info-row"><span class="info-label">Điện thoại:</span><span class="info-dots"></span></div>
          <div class="info-row"><span class="info-label">Email:</span><span class="info-dots"></span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th width="5%">STT</th>
              <th width="45%">Tên sản phẩm</th>
              <th width="10%">Đvt</th>
              <th width="10%">Số lượng</th>
              <th width="15%">Đơn giá</th>
              <th width="15%">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            ${tfootHtml}
          </tfoot>
        </table>

        <div style="margin-top: 10px; font-size: 15px;">
          <strong>Bằng chữ:</strong> <em>${bangChu}</em>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="width: 280px;"></div>
          <div style="width: 280px; text-align: center;">
            <span class="date">Đề Gi, ngày ${day} tháng ${month} năm ${year}</span>
          </div>
        </div>
        <div class="footer">
          <div class="footer-column">
            <div style="font-weight: bold;">Người nhận</div>
            <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
            <div class="signature-space"></div>
          </div>
          <div class="footer-column">
            <div style="font-weight: bold;">Người lập</div>
            <div style="font-style: italic; margin-top: 4px;">(Ký và ghi rõ họ tên)</div>
            <div class="signature-space"></div>
            <div style="font-weight: bold; font-size: 18px;">Nguyễn Thị Mai</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = () => {
          const element = document.getElementById('pdf-content');
          const opt = {
            margin: 0,
            filename: '${fileName}',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          html2pdf().set(opt).from(element).save().then(() => window.close());
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
'''

with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\lib\document-service.ts', 'a', encoding='utf-8') as f:
    f.write(new_func)
print('Done!')
