import sys, re

with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\lib\document-service.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rename export function
content = content.replace('export const exportSalesReceiptToExcel = (items: CartItem[], grandTotal: number) => {', 
'''export const exportDocumentToExcel = (items: CartItem[], grandTotal: number, docType: 'receipt' | 'quotation', includeVAT: boolean = false) => {''')

content = content.replace("XLSX.utils.book_append_sheet(workbook, worksheet, 'PhieuBanHang');",
"""const sheetName = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);""")

content = content.replace("const fileName = `PhieuBanHang_MaiVinh_${day}${month}${year}.xlsx`;",
"""const prefix = docType === 'quotation' ? 'BaoGia' : 'PhieuBanHang';
  const fileName = `${prefix}_MaiVinh_${day}${month}${year}.xlsx`;""")

# 2. Quotation parameters
content = content.replace('export const printQuotationHTML = (items: CartItem[], grandTotal: number) => {',
'export const printQuotationHTML = (items: CartItem[], grandTotal: number, includeVAT: boolean = true) => {')

# 3. Quotation VAT rows
tfoot_target = '''        <tfoot>
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
        </tfoot>'''

tfoot_replacement = '''        <tfoot>
          ${includeVAT ? `
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
          ` : `
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td colspan="5" class="text-center">TỔNG CỘNG</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(grandTotal)}</td>
          </tr>
          `}
        </tfoot>'''

content = content.replace(tfoot_target, tfoot_replacement)

# 4. Replace Bằng chữ in printQuotationHTML
bangchu_target = '''<strong>Bằng chữ:</strong> <em>${(() => { const cfg = new ReadingConfig(); cfg.unit = ['đồng']; const txt = doReadNumber(String(Math.round(grandTotal * 1.08)), cfg); return txt.charAt(0).toUpperCase() + txt.slice(1); })()}</em>'''

bangchu_replacement = '''<strong>Bằng chữ:</strong> <em>${(() => { const cfg = new ReadingConfig(); cfg.unit = ['đồng']; const finalTotal = includeVAT ? Math.round(grandTotal * 1.08) : Math.round(grandTotal); const txt = doReadNumber(String(finalTotal), cfg); return txt.charAt(0).toUpperCase() + txt.slice(1); })()}</em>'''

content = content.replace(bangchu_target, bangchu_replacement)

# Fix CartContent.tsx imports
with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\app\cart\CartContent.tsx', 'r', encoding='utf-8') as f:
    cart_content = f.read()

cart_content = cart_content.replace('exportSalesReceiptToExcel', 'exportDocumentToExcel')
with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\app\cart\CartContent.tsx', 'w', encoding='utf-8') as f:
    f.write(cart_content)

with open(r'd:\DATA\LearnWeb\BangGiaPhuKienDienNuocMaiVinh\lib\document-service.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
