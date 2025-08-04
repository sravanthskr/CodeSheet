import Papa from 'papaparse';
import { Problem } from '@/types';

export interface ParseResult {
  data: Omit<Problem, 'id'>[];
  errors: string[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const data: Omit<Problem, 'id'>[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            const problem = validateProblemData(row, index + 1);
            data.push(problem);
          } catch (error: any) {
            errors.push(`Row ${index + 1}: ${error.message}`);
          }
        });

        resolve({ data, errors });
      },
      error: (error) => {
        resolve({ 
          data: [], 
          errors: [`CSV parsing error: ${error.message}`] 
        });
      }
    });
  });
}

export function parseJSON(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        const errors: string[] = [];
        const data: Omit<Problem, 'id'>[] = [];

        if (!Array.isArray(jsonData)) {
          throw new Error('JSON must be an array of problems');
        }

        jsonData.forEach((row: any, index: number) => {
          try {
            const problem = validateProblemData(row, index + 1);
            data.push(problem);
          } catch (error: any) {
            errors.push(`Item ${index + 1}: ${error.message}`);
          }
        });

        resolve({ data, errors });
      } catch (error: any) {
        resolve({ 
          data: [], 
          errors: [`JSON parsing error: ${error.message}`] 
        });
      }
    };

    reader.onerror = () => {
      resolve({ 
        data: [], 
        errors: ['File reading error'] 
      });
    };

    reader.readAsText(file);
  });
}

function validateProblemData(row: any, rowNumber: number): Omit<Problem, 'id'> {
  const requiredFields = ['title', 'link', 'topic', 'subTopic', 'difficulty', 'sheetType'];
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  const validSheetTypes = ['DSA', 'SQL', 'System Design', 'Web Development'];

  // Check required fields
  for (const field of requiredFields) {
    if (!row[field] || typeof row[field] !== 'string' || row[field].trim() === '') {
      throw new Error(`Missing or invalid ${field}`);
    }
  }

  // Validate difficulty
  if (!validDifficulties.includes(row.difficulty)) {
    throw new Error(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
  }

  // Validate sheet type
  if (!validSheetTypes.includes(row.sheetType)) {
    throw new Error(`Invalid sheetType. Must be one of: ${validSheetTypes.join(', ')}`);
  }

  // Validate URL
  try {
    new URL(row.link);
  } catch {
    throw new Error('Invalid URL format for link');
  }

  return {
    title: row.title.trim(),
    link: row.link.trim(),
    topic: row.topic.trim(),
    subTopic: row.subTopic.trim(),
    difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
    sheetType: row.sheetType as 'DSA' | 'SQL' | 'System Design' | 'Web Development'
  };
}
