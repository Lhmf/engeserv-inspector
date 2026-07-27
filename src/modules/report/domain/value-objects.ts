/**
 * Report Domain - Value Objects
 * 
 * Objetos de valor imutáveis para o domínio de Laudos.
 */

import { generateId } from '../utils/id-generator';

// ============================================================
// VERSION
// ============================================================

export class ReportVersion {
  private readonly _version: number;
  private readonly _date: Date;
  private readonly _authorId: string;
  private readonly _authorName: string;
  private readonly _authorRole: string;
  private readonly _changes: string;
  private readonly _status: string;
  private readonly _previousVersion?: number;

  constructor(
    version: number,
    authorId: string,
    authorName: string,
    authorRole: string,
    changes: string,
    status: string,
    previousVersion?: number
  ) {
    if (version < 1) throw new Error('Versão deve ser >= 1');
    if (!authorId || !authorName) throw new Error('Autor obrigatório');
    
    this._version = version;
    this._date = new Date();
    this._authorId = authorId;
    this._authorName = authorName;
    this._authorRole = authorRole;
    this._changes = changes;
    this._status = status;
    this._previousVersion = previousVersion;
  }

  get version(): number { return this._version; }
  get date(): Date { return this._date; }
  get authorId(): string { return this._authorId; }
  get authorName(): string { return this._authorName; }
  get authorRole(): string { return this._authorRole; }
  get changes(): string { return this._changes; }
  get status(): string { return this._status; }
  get previousVersion(): number | undefined { return this._previousVersion; }

  toPlain(): object {
    return {
      version: this._version,
      date: this._date.toISOString(),
      authorId: this._authorId,
      authorName: this._authorName,
      authorRole: this._authorRole,
      changes: this._changes,
      status: this._status,
      previousVersion: this._previousVersion,
    };
  }

  static createNew(
    currentVersion: number,
    authorId: string,
    authorName: string,
    authorRole: string,
    changes: string,
    status: string
  ): ReportVersion {
    return new ReportVersion(currentVersion + 1, authorId, authorName, authorRole, changes, status, currentVersion);
  }
}

// ============================================================
// REPORT NUMBER
// ============================================================

export class ReportNumber {
  private readonly _value: string;

  constructor(value: string) {
    const pattern = /^LT-\d{4}-\d{5}$/;
    if (!pattern.test(value)) {
      throw new Error('Número do laudo deve seguir o padrão LT-YYYY-NNNNN');
    }
    this._value = value;
  }

  get value(): string { return this._value; }

  static generate(year: number, sequence: number): ReportNumber {
    return new ReportNumber(`LT-${year}-${sequence.toString().padStart(5, '0')}`);
  }

  equals(other: ReportNumber): boolean {
    return this._value === other._value;
  }

  toString(): string { return this._value; }
}

// ============================================================
// ART NUMBER
// ============================================================

export class ArtNumber {
  private readonly _value: string;

  constructor(value: string) {
    // Padrão simplificado ART: 6 dígitos + dígito verificador
    if (value && !/^\d{6}-\d$/.test(value)) {
      throw new Error('Número da ART deve seguir o padrão 999999-9');
    }
    this._value = value;
  }

  get value(): string { return this._value; }
  isValid(): boolean { return !!this._value; }
  toString(): string { return this._value || ''; }
}

// ============================================================
// SIGNATURE
// ============================================================

export interface SignatureData {
  role: 'INSPECTOR' | 'ENGINEER' | 'MANAGER' | 'CLIENT';
  userId: string;
  userName: string;
  userRegistration?: string;
  signedAt: Date;
  signatureHash?: string;
  ipAddress?: string;
}

export class ReportSignature {
  private readonly _data: SignatureData;

  constructor(data: SignatureData) {
    if (!data.role || !data.userId || !data.userName) {
      throw new Error('Role, userId e userName são obrigatórios');
    }
    this._data = {
      ...data,
      signedAt: data.signedAt || new Date(),
    };
  }

  get role(): string { return this._data.role; }
  get userId(): string { return this._data.userId; }
  get userName(): string { return this._data.userName; }
  get userRegistration(): string | undefined { return this._data.userRegistration; }
  get signedAt(): Date { return this._data.signedAt; }
  get signatureHash(): string | undefined { return this._data.signatureHash; }
  get ipAddress(): string | undefined { return this._data.ipAddress; }

  toPlain(): object {
    return { ...this._data };
  }
}

// ============================================================
// DATE RANGE
// ============================================================

export class DateRange {
  private readonly _start: Date;
  private readonly _end: Date;

  constructor(start: Date, end: Date) {
    if (start >= end) {
      throw new Error('Data inicial deve ser anterior à data final');
    }
    this._start = new Date(start);
    this._end = new Date(end);
  }

  get start(): Date { return this._start; }
  get end(): Date { return this._end; }
  
  get durationDays(): number {
    return Math.ceil((this._end.getTime() - this._start.getTime()) / (1000 * 60 * 60 * 24));
  }

  contains(date: Date): boolean {
    return date >= this._start && date <= this._end;
  }

  toPlain(): object {
    return {
      start: this._start.toISOString(),
      end: this._end.toISOString(),
      durationDays: this.durationDays,
    };
  }
}

// ============================================================
// MEASUREMENT STATISTICS
// ============================================================

export class MeasurementStats {
  private readonly _count: number;
  private readonly _min: number;
  private readonly _max: number;
  private readonly _avg: number;
  private readonly _belowMinCount: number;
  private readonly _belowMinPercentage: number;

  constructor(measurements: number[], minThickness: number) {
    if (measurements.length === 0) {
      this._count = 0;
      this._min = 0;
      this._max = 0;
      this._avg = 0;
      this._belowMinCount = 0;
      this._belowMinPercentage = 0;
      return;
    }

    this._count = measurements.length;
    this._min = Math.min(...measurements);
    this._max = Math.max(...measurements);
    this._avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    this._belowMinCount = measurements.filter(m => m < minThickness).length;
    this._belowMinPercentage = (this._belowMinCount / this._count) * 100;
  }

  get count(): number { return this._count; }
  get min(): number { return this._min; }
  get max(): number { return this._max; }
  get avg(): number { return this._avg; }
  get belowMinCount(): number { return this._belowMinCount; }
  get belowMinPercentage(): number { return this._belowMinPercentage; }

  toPlain(): object {
    return {
      count: this._count,
      min: Number(this._min.toFixed(2)),
      max: Number(this._max.toFixed(2)),
      avg: Number(this._avg.toFixed(2)),
      belowMinCount: this._belowMinCount,
      belowMinPercentage: Number(this._belowMinPercentage.toFixed(1)),
    };
  }
}