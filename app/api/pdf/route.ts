import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const { markdown } = await req.json();
  if (!markdown || typeof markdown !== 'string') {
    return NextResponse.json({ error: 'Markdown required' }, { status: 400 });
  }

  const tempMd = path.join(os.tmpdir(), `in_${Date.now()}.md`);
  const tempPdf = path.join(os.tmpdir(), `out_${Date.now()}.pdf`);
  await fs.writeFile(tempMd, markdown, 'utf-8');

  const script = path.join(process.cwd(), 'scripts', 'generateCustomerPdf.py');
  try {
    await execAsync(`python3 "${script}" "${tempMd}" "${tempPdf}"`);
    const pdfBuffer = await fs.readFile(tempPdf);
    await fs.unlink(tempMd).catch(() => {});
    await fs.unlink(tempPdf).catch(() => {});
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="condyn_report.pdf"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
