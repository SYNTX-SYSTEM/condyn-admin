import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API Route: GET /api/topology/[companyId]
 * 
 * Loads field topology and projected signals for a company.
 * Server-side file reading (fs module works here!)
 * 
 * NOTE: Next.js 15+ params are async (Promise)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { companyId } = await params;
    
    // Load field topology
    const topologyPath = path.join(
      process.cwd(),
      'data',
      'companies',
      companyId,
      'signals',
      'field_topology.json'
    );
    
    if (!fs.existsSync(topologyPath)) {
      return NextResponse.json(
        { error: `Field topology not found for ${companyId}` },
        { status: 404 }
      );
    }
    
    const topologyData = JSON.parse(fs.readFileSync(topologyPath, 'utf-8'));
    
    // Load projected signals
    const signalsPath = path.join(
      process.cwd(),
      'data',
      'companies',
      companyId,
      'signals',
      'signals_projected.json'
    );
    
    if (!fs.existsSync(signalsPath)) {
      return NextResponse.json(
        { error: `Projected signals not found for ${companyId}` },
        { status: 404 }
      );
    }
    
    const signalsData = JSON.parse(fs.readFileSync(signalsPath, 'utf-8'));
    
    // Return combined data
    return NextResponse.json({
      topology: topologyData,
      signals: signalsData.signals
    });
    
  } catch (error: any) {
    console.error('API error loading topology:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
