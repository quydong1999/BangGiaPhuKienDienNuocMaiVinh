import sys

with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\lib\document-service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the exportDocumentToExcel function
start_marker = "export const exportDocumentToExcel = (items: CartItem[], grandTotal: number, docType: 'receipt' | 'quotation', includeVAT: boolean = false) => {"
end_marker = "export const printSalesReceiptHTML = (items: CartItem[], grandTotal: number) => {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Markers not found')
    sys.exit(1)

new_func = '''export const exportDocumentToExcel = (items: CartItem[], grandTotal: number, docType: 'receipt' | 'quotation', includeVAT: boolean = false) => {
  const aoa: any[][] = [];

  // Header
  aoa.push(['Cửa hàng Điện nước Mai Vinh', '', '', '', '', '']);
  aoa.push(['Địa chỉ: Thắng Kiên - Đề Gi - Gia Lai', '', '', '', '', '']);
  aoa.push(['SĐT: 0976 576 443 - 0982 390 943', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Title
  const title = docType === 'quotation' ? 'BẢNG BÁO GIÁ' : 'PHIẾU BÁN HÀNG';
  aoa.push([title, '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Customer info
  aoa.push(['Tên khách hàng:', '', '', '', '', '']);
  aoa.push(['Mã số thuế:', '', '', '', '', '']);
  aoa.push(['Điện thoại:', '', '', '', '', '']);
  aoa.push(['Email:', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Table Header
  const tableStartRow = aoa.length;
  aoa.push(['STT', 'Tên sản phẩm', 'Đvt', 'Số lượng', 'Đơn giá', 'Thành tiền']);

  // Table Body
  items.forEach((item, index) => {
    const cleanedSpec = cleanSpecName(item.specName);
    const isVisibleSpec = cleanedSpec && cleanedSpec !== '-' && cleanedSpec !== 'Mặc định';
    const productName = isVisibleSpec
      ? `${item.product.name} (${cleanedSpec})`
      : item.product.name;
    aoa.push([index + 1, productName, item.unit, item.quantity, item.price, item.price * item.quantity]);
  });

  // Table Footer (Total)
  if (docType === 'quotation' && includeVAT) {
    aoa.push(['', 'TỔNG CỘNG TRƯỚC VAT', '', '', '', grandTotal]);
    aoa.push(['', 'VAT (8%)', '', '', '', Math.round(grandTotal * 0.08)]);
    aoa.push(['', 'TỔNG CỘNG SAU VAT', '', '', '', Math.round(grandTotal * 1.08)]);
  } else {
    aoa.push(['', 'TỔNG CỘNG', '', '', '', grandTotal]);
  }
  const tableEndRow = aoa.length - 1;

  // "Bằng chữ"
  aoa.push(['', '', '', '', '', '']);
  const finalTotal = docType === 'quotation' && includeVAT ? Math.round(grandTotal * 1.08) : Math.round(grandTotal);
  const cfg = new ReadingConfig();
  cfg.unit = ['đồng'];
  const txt = doReadNumber(String(finalTotal), cfg);
  const bangChu = txt.charAt(0).toUpperCase() + txt.slice(1);
  aoa.push(['Bằng chữ:', bangChu, '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);

  // Date and Signatures
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  aoa.push(['', '', '', '', `Đề Gi, ngày ${day} tháng ${month} năm ${year}`, '']);
  aoa.push(['', 'Người nhận', '', '', 'Người lập', '']);
  aoa.push(['', '(Ký và ghi rõ họ tên)', '', '', '(Ký và ghi rõ họ tên)', '']);
  aoa.push(['', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);
  aoa.push(['', '', '', '', '', '']);
  aoa.push(['', '', '', '', 'Nguyễn Thị Mai', '']);

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  // Merges
  const merges: XLSX.Range[] = [];
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
  merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
  merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }); // Title

  const bangChuRow = tableEndRow + 2;
  merges.push({ s: { r: bangChuRow, c: 1 }, e: { r: bangChuRow, c: 5 } });

  const dateRow = bangChuRow + 2;
  merges.push({ s: { r: dateRow, c: 4 }, e: { r: dateRow, c: 5 } });
  merges.push({ s: { r: dateRow + 1, c: 1 }, e: { r: dateRow + 1, c: 2 } }); // Người nhận
  merges.push({ s: { r: dateRow + 1, c: 4 }, e: { r: dateRow + 1, c: 5 } }); // Người lập
  merges.push({ s: { r: dateRow + 2, c: 1 }, e: { r: dateRow + 2, c: 2 } }); // (Ký)
  merges.push({ s: { r: dateRow + 2, c: 4 }, e: { r: dateRow + 2, c: 5 } }); // (Ký)
  merges.push({ s: { r: dateRow + 6, c: 4 }, e: { r: dateRow + 6, c: 5 } }); // Mai

  if (docType === 'quotation' && includeVAT) {
    merges.push({ s: { r: tableEndRow - 2, c: 1 }, e: { r: tableEndRow - 2, c: 4 } });
    merges.push({ s: { r: tableEndRow - 1, c: 1 }, e: { r: tableEndRow - 1, c: 4 } });
    merges.push({ s: { r: tableEndRow, c: 1 }, e: { r: tableEndRow, c: 4 } });
  } else {
    merges.push({ s: { r: tableEndRow, c: 1 }, e: { r: tableEndRow, c: 4 } });
  }

  worksheet['!merges'] = merges;
  worksheet['!cols'] = [
    { wch: 8 },  // STT
    { wch: 45 }, // Tên sản phẩm
    { wch: 10 }, // Đvt
    { wch: 10 }, // Số lượng
    { wch: 15 }, // Đơn giá
    { wch: 15 }, // Thành tiền
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: 's', v: '' };
      }
      const cell = worksheet[cellRef];
      if (!cell.s) cell.s = {};

      cell.s.font = { name: 'Times New Roman', sz: 12 };

      // Header styling
      if (R === 0) {
        cell.s.font.bold = true;
        cell.s.font.sz = 16;
        cell.s.alignment = { horizontal: 'center' };
      } else if (R === 1 || R === 2) {
        cell.s.alignment = { horizontal: 'center' };
      } else if (R === 4) { // Title
        cell.s.font.bold = true;
        cell.s.font.sz = 20;
        cell.s.alignment = { horizontal: 'center' };
      } else if (R >= 6 && R <= 9) { // Customer info
        if (C === 0) cell.s.font.bold = true;
      }

      // Table styling
      if (R >= tableStartRow && R <= tableEndRow) {
        const isTableHeader = R === tableStartRow;
        const isTotalRow = R > tableStartRow + items.length;

        cell.s.border = {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'thin', color: { rgb: "000000" } },
          left: { style: 'thin', color: { rgb: "000000" } },
          right: { style: 'thin', color: { rgb: "000000" } }
        };

        if (isTableHeader || isTotalRow) {
          cell.s.fill = { fgColor: { rgb: "EAEAEA" } };
          cell.s.font.bold = true;
        }
        if (isTableHeader) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else {
          if (C === 0 || C === 2 || C === 3) { // STT, Đvt, Số lượng
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          }
          if (isTotalRow && (C >= 1 && C <= 4)) {
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          }
          if (C === 4 || C === 5) { // Prices
            cell.z = '#,##0';
          }
        }
      }

      // Bang chu styling
      if (R === bangChuRow) {
        if (C === 0) cell.s.font.bold = true;
        if (C === 1) cell.s.font.italic = true;
      }

      // Date & Signatures styling
      if (R === dateRow && C === 4) {
        cell.s.font.italic = true;
        cell.s.alignment = { horizontal: 'center' };
      }
      if ((R === dateRow + 1 || R === dateRow + 6) && (C === 1 || C === 4)) {
        cell.s.font.bold = true;
        cell.s.alignment = { horizontal: 'center' };
      }
      if (R === dateRow + 2 && (C === 1 || C === 4)) {
        cell.s.font.italic = true;
        cell.s.alignment = { horizontal: 'center' };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  const sheetName = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const prefix = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  const fileName = `${prefix}_MaiVinh_${day}${month}${year}.xlsx`;

  XLSX.writeFile(workbook, fileName);
};
'''

new_content = content[:start_idx] + new_func + content[end_idx:]

with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\lib\document-service.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done!')
