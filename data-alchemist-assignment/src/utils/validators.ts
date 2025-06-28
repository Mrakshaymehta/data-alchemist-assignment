interface ValidationError {
  rowIndex: number;
  field: string;
  message: string;
}

interface ValidationResult {
  validated: boolean;
  errors: ValidationError[];
}

export function validateData(entityType: string, data: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!data || data.length === 0) {
    return { validated: true, errors: [] };
  }

  // Check for missing or duplicate IDs
  const idField = getIDField(entityType);
  const ids = new Set<string | number>();
  
  data.forEach((row, rowIndex) => {
    // Check for missing ID
    if (!row[idField] || row[idField] === '') {
      errors.push({
        rowIndex,
        field: idField,
        message: `Missing ${idField}`
      });
    } else {
      // Check for duplicate ID
      if (ids.has(row[idField])) {
        errors.push({
          rowIndex,
          field: idField,
          message: `Duplicate ${idField}: ${row[idField]}`
        });
      } else {
        ids.add(row[idField]);
      }
    }

    // Entity-specific validation
    switch (entityType) {
      case 'clients':
        validateClient(row, rowIndex, errors);
        break;
      case 'workers':
        validateWorker(row, rowIndex, errors);
        break;
      case 'tasks':
        validateTask(row, rowIndex, errors);
        break;
    }
  });

  return {
    validated: errors.length === 0,
    errors
  };
}

function getIDField(entityType: string): string {
  switch (entityType) {
    case 'clients':
      return 'ClientID';
    case 'workers':
      return 'WorkerID';
    case 'tasks':
      return 'TaskID';
    default:
      return 'ID';
  }
}

function validateClient(row: any, rowIndex: number, errors: ValidationError[]) {
  // Validate PriorityLevel is a number from 1 to 5
  if (row.PriorityLevel !== undefined && row.PriorityLevel !== null && row.PriorityLevel !== '') {
    const priority = Number(row.PriorityLevel);
    if (isNaN(priority) || priority < 1 || priority > 5) {
      errors.push({
        rowIndex,
        field: 'PriorityLevel',
        message: 'PriorityLevel must be a number between 1 and 5'
      });
    }
  }

  // Validate RequestedTaskIDs is not empty and contains valid format
  if (row.RequestedTaskIDs !== undefined && row.RequestedTaskIDs !== null && row.RequestedTaskIDs !== '') {
    const taskIds = row.RequestedTaskIDs.split(',').map((id: string) => id.trim());
    if (taskIds.length === 0 || taskIds.some((id: string) => id === '')) {
      errors.push({
        rowIndex,
        field: 'RequestedTaskIDs',
        message: 'RequestedTaskIDs must contain valid task IDs separated by commas'
      });
    }
  }

  // Validate AttributesJSON is valid JSON
  if (row.AttributesJSON !== undefined && row.AttributesJSON !== null && row.AttributesJSON !== '') {
    try {
      JSON.parse(row.AttributesJSON);
    } catch {
      errors.push({
        rowIndex,
        field: 'AttributesJSON',
        message: 'AttributesJSON must be valid JSON'
      });
    }
  }
}

function validateWorker(row: any, rowIndex: number, errors: ValidationError[]) {
  // Validate AvailableSlots is a valid JSON array
  if (row.AvailableSlots !== undefined && row.AvailableSlots !== null && row.AvailableSlots !== '') {
    try {
      const slots = JSON.parse(row.AvailableSlots);
      if (!Array.isArray(slots)) {
        errors.push({
          rowIndex,
          field: 'AvailableSlots',
          message: 'AvailableSlots must be a valid JSON array'
        });
      }
    } catch {
      errors.push({
        rowIndex,
        field: 'AvailableSlots',
        message: 'AvailableSlots must be valid JSON'
      });
    }
  }

  // Validate MaxLoadPerPhase is a positive number
  if (row.MaxLoadPerPhase !== undefined && row.MaxLoadPerPhase !== null && row.MaxLoadPerPhase !== '') {
    const maxLoad = Number(row.MaxLoadPerPhase);
    if (isNaN(maxLoad) || maxLoad < 1) {
      errors.push({
        rowIndex,
        field: 'MaxLoadPerPhase',
        message: 'MaxLoadPerPhase must be a positive number'
      });
    }
  }

  // Validate QualificationLevel is a number from 1 to 5
  if (row.QualificationLevel !== undefined && row.QualificationLevel !== null && row.QualificationLevel !== '') {
    const qualification = Number(row.QualificationLevel);
    if (isNaN(qualification) || qualification < 1 || qualification > 5) {
      errors.push({
        rowIndex,
        field: 'QualificationLevel',
        message: 'QualificationLevel must be a number between 1 and 5'
      });
    }
  }
}

function validateTask(row: any, rowIndex: number, errors: ValidationError[]) {
  // Ensure Duration ≥ 1
  if (row.Duration !== undefined && row.Duration !== null && row.Duration !== '') {
    const duration = Number(row.Duration);
    if (isNaN(duration) || duration < 1) {
      errors.push({
        rowIndex,
        field: 'Duration',
        message: 'Duration must be a number greater than or equal to 1'
      });
    }
  }

  // MaxConcurrent is a positive number
  if (row.MaxConcurrent !== undefined && row.MaxConcurrent !== null && row.MaxConcurrent !== '') {
    const maxConcurrent = Number(row.MaxConcurrent);
    if (isNaN(maxConcurrent) || maxConcurrent < 1) {
      errors.push({
        rowIndex,
        field: 'MaxConcurrent',
        message: 'MaxConcurrent must be a positive number'
      });
    }
  }

  // Validate PreferredPhases format (e.g., "1  -  2")
  if (row.PreferredPhases !== undefined && row.PreferredPhases !== null && row.PreferredPhases !== '') {
    const phasePattern = /^\d+\s*-\s*\d+$/;
    if (!phasePattern.test(row.PreferredPhases)) {
      errors.push({
        rowIndex,
        field: 'PreferredPhases',
        message: 'PreferredPhases must be in format "start - end" (e.g., "1 - 2")'
      });
    }
  }
} 