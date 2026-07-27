/**
 * Report Domain - Domain Events
 * 
 * Eventos de domínio para o módulo de Laudos.
 */

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: any;
}

export class ReportCreatedEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_CREATED';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    clientId: string;
    equipmentId: string;
    inspectionId: string;
    createdBy: string;
  };

  constructor(
    aggregateId: string,
    reportNumber: string,
    clientId: string,
    equipmentId: string,
    inspectionId: string,
    createdBy: string
  ) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = {
      reportNumber,
      clientId,
      equipmentId,
      inspectionId,
      createdBy,
    };
  }
}

export class ReportSubmittedForReviewEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_SUBMITTED_FOR_REVIEW';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    submittedBy: string;
    previousStatus: string;
  };

  constructor(aggregateId: string, reportNumber: string, submittedBy: string, previousStatus: string) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = { reportNumber, submittedBy, previousStatus };
  }
}

export class ReportApprovedEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_APPROVED';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    approvedBy: string;
    approverRole: string;
    previousStatus: string;
  };

  constructor(aggregateId: string, reportNumber: string, approvedBy: string, approverRole: string, previousStatus: string) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = { reportNumber, approvedBy, approverRole, previousStatus };
  }
}

export class ReportRejectedEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_REJECTED';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    rejectedBy: string;
    reason: string;
    previousStatus: string;
  };

  constructor(aggregateId: string, reportNumber: string, rejectedBy: string, reason: string, previousStatus: string) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = { reportNumber, rejectedBy, reason, previousStatus };
  }
}

export class ReportPublishedEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_PUBLISHED';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    publishedBy: string;
    version: number;
  };

  constructor(aggregateId: string, reportNumber: string, publishedBy: string, version: number) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = { reportNumber, publishedBy, version };
  }
}

export class ReportSignedEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_SIGNED';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    signerId: string;
    signerName: string;
    signerRole: string;
    signatureHash: string;
  };

  constructor(aggregateId: string, reportNumber: string, signerId: string, signerName: string, signerRole: string, signatureHash: string) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = { reportNumber, signerId, signerName, signerRole, signatureHash };
  }
}

export class ReportVersionCreatedEvent implements DomainEvent {
  eventId: string;
  eventType = 'REPORT_VERSION_CREATED';
  aggregateId: string;
  occurredAt: Date;
  payload: {
    reportNumber: string;
    newVersion: number;
    previousVersion: number;
    createdBy: string;
    observations: string;
  };

  constructor(aggregateId: string, reportNumber: string, newVersion: number, previousVersion: number, createdBy: string, observations: string) {
    this.eventId = generateId('evt');
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = { reportNumber, newVersion, previousVersion, createdBy, observations };
  }
}

// Import
import { generateId } from '../utils/id-generator';