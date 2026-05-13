/**
 * RRFA Carrier Registry
 * 
 * Universal carrier parsing and identification.
 * This will become HUGE later (SAP, Jira, Slack, IoT, Sensors, etc.)
 * 
 * For now: Simple prefix-based parsing.
 */

export interface CarrierReference {
  carrier_id: string;      // Full original identifier
  carrier_type: string;    // Universal type (NOT an enum!)
}

export class CarrierRegistry {
  
  /**
   * Parse ANY carrier format to universal reference
   * 
   * Current format: PREFIX_COMPANY_ID
   * Examples:
   *   MAIL_NOVA_001 → {carrier_id: "MAIL_NOVA_001", carrier_type: "mail"}
   *   SHIFT_MED_042 → {carrier_id: "SHIFT_MED_042", carrier_type: "shift"}
   *   KPI_HELIX_2026_05 → {carrier_id: "KPI_HELIX_2026_05", carrier_type: "kpi"}
   * 
   * Future: Will support external adapters
   */
  static parse(nodeId: string): CarrierReference {
    // Extract type from prefix
    const parts = nodeId.split('_');
    const typePrefix = parts[0].toLowerCase();
    
    return {
      carrier_id: nodeId,
      carrier_type: typePrefix
    };
  }
  
  /**
   * Batch parse multiple carrier IDs
   */
  static parseBatch(nodeIds: string[]): CarrierReference[] {
    return nodeIds.map(id => this.parse(id));
  }
  
  // ========================================
  // FUTURE EXTERNAL ADAPTERS
  // ========================================
  
  // static parseSAP(sapId: string): CarrierReference {
  //   // SAP-specific parsing logic
  // }
  
  // static parseJira(jiraTicketId: string): CarrierReference {
  //   // Jira-specific parsing logic
  // }
  
  // static parseSlack(slackMessageId: string): CarrierReference {
  //   // Slack-specific parsing logic
  // }
  
  // static parseIoTSensor(sensorId: string): CarrierReference {
  //   // IoT sensor-specific parsing logic
  // }
}
