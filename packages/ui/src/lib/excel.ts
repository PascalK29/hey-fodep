import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ALL_DEFS } from '@heyfodep/kernel';

function sanitizeSheetName(name: string) {
  return name.replace(/[\[\]\*?\/\\]/g, '').substring(0, 31);
}

// Générer un template structuré et professionnel avec exceljs
export async function downloadExcelTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'HEYFODEP';
  wb.created = new Date();
  
  const inputs = ALL_DEFS.filter(def => def.kind === 'input');
  const sections = [...new Set(inputs.map(d => d.section || 'Général'))];
  
  sections.forEach(section => {
    const ws = wb.addWorksheet(sanitizeSheetName(section));
    
    // Configuration des colonnes
    ws.columns = [
      { header: 'CATÉGORIE', key: 'category', width: 22 },
      { header: 'CODE DISPRU', key: 'code', width: 18 },
      { header: 'LIBELLÉ DE L\'INDICATEUR', key: 'label', width: 70 },
      { header: 'UNITÉ', key: 'unit', width: 15 },
      { header: 'VALEUR À SAISIR', key: 'valeur', width: 25 },
    ];

    // Style de l'en-tête (ligne 1)
    const headerRow = ws.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A2542' } // Bleu foncé
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Figer la ligne d'en-tête
    ws.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'E2' }
    ];

    // Remplissage des données
    const sectionInputs = inputs.filter(def => (def.section || 'Général') === section);
    
    sectionInputs.forEach((def) => {
      // Nettoyage basique du libellé pour retirer la numérotation (ex: "1. ", "1.1 ")
      const cleanLabel = def.label.replace(/^[\d\.\s-]+/, '');

      const row = ws.addRow({
        category: section,
        code: def.code,
        label: cleanLabel,
        unit: def.unit === 'MFCFA' ? 'M FCFA' : def.unit === 'PCT' ? '%' : def.unit,
        valeur: ''
      });

      // Style des cellules de données
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Bordures fines
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFCCCCCC' } },
          left: { style: 'hair', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
          right: { style: 'hair', color: { argb: 'FFCCCCCC' } }
        };
        
        cell.alignment = { vertical: 'middle', wrapText: colNumber === 3 };
        
        // Catégorie
        if (colNumber === 1) {
          cell.font = { color: { argb: 'FF666666' }, italic: true, size: 10 };
        }
        // Code DISPRU
        if (colNumber === 2) {
          cell.font = { bold: true, color: { argb: 'FF3B49DF' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        // Unité
        if (colNumber === 4) {
          cell.font = { color: { argb: 'FF888888' }, size: 9, bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        // Montant (Saisie)
        if (colNumber === 5) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF4F7FA' } // Fond très léger (bleuté)
          };
          cell.font = { bold: true };
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (def.unit === 'PCT') {
            cell.numFmt = '0.00%';
          } else {
            cell.numFmt = '#,##0.00';
          }
        }
      });
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Modele_Saisie_FODEP.xlsx');
}

export function downloadOfficialFodepTemplate() {
  const link = document.createElement('a');
  link.href = '/FODEP_Officiel.xlsx';
  link.download = 'Matrice_FODEP_Officielle.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Lire un fichier importé (parcourt toutes les feuilles)
export function parseExcelFile(file: File): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Vérification stricte des feuilles pour le modèle de saisie
        const validSheets = new Set(ALL_DEFS.map(d => sanitizeSheetName(d.section || 'Général')));
        const hasValidSheet = workbook.SheetNames.some(name => validSheets.has(name));
        if (!hasValidSheet) {
          return reject(new Error("SHEET_ERROR"));
        }

        const result: Record<string, number> = {};
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
          
          jsonData.forEach((row) => {
            const code = row['Code DISPRU'] || row['CODE DISPRU'] || row['code'] || row['Code'] || row['CODE'];
            let valeur = row['VALEUR À SAISIR'] ?? row['Valeur à saisir'] ?? row['MONTANT (M FCFA)'] ?? row['Montant (M FCFA)'] ?? row['Valeur (M FCFA)'] ?? row['Valeur'] ?? row['valeur'];
            
            if (code && typeof code === 'string') {
              if (typeof valeur === 'string') {
                valeur = parseFloat(valeur.replace(/\s/g, '').replace(',', '.'));
              }
              if (!isNaN(valeur) && valeur !== null && valeur !== undefined) {
                // Si la valeur est en % et saisie comme < 1 ou formatée, on assume qu'Excel la stocke en décimal.
                // Le noyau attend des montants bruts ou des pourcentages bruts selon `def.unit`.
                result[code.trim()] = Number(valeur);
              }
            }
          });
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// Lire un vrai fichier officiel FODEP (BCEAO)
// Heuristique : On parcourt toutes les cellules de toutes les feuilles.
// Si une cellule contient un code DISPRU valide (ex: 'FPI01'), 
// on cherche la première valeur numérique située à sa droite sur la même ligne.
export function parseOfficialFodepFile(file: File): Promise<Record<string, number>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Un fichier officiel devrait au moins contenir des feuilles dont le nom évoque les états EP (ex: EP01, EP03)
        // ou le terme FODEP
        const hasValidSheet = workbook.SheetNames.some(name => /EP\s*0?\d/i.test(name) || /FODEP/i.test(name) || /ETAT/i.test(name));
        if (!hasValidSheet) {
          return reject(new Error("SHEET_ERROR_FODEP"));
        }

        const result: Record<string, number> = {};
        
        // On ne cherche que les codes qui sont des 'inputs'
        const validCodes = new Set(ALL_DEFS.filter(d => d.kind === 'input').map(d => d.code));
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          // Convertir en tableau 2D brut
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          
          rows.forEach((row) => {
            if (!Array.isArray(row)) return;
            
            // Chercher un code DISPRU dans la ligne
            for (let col = 0; col < row.length; col++) {
              const cell = row[col];
              if (typeof cell === 'string') {
                const code = cell.trim();
                
                if (validCodes.has(code)) {
                  // Code trouvé ! Chercher la première valeur numérique à sa droite
                  for (let vCol = col + 1; vCol < row.length; vCol++) {
                    let val = row[vCol];
                    
                    if (typeof val === 'string') {
                      // Nettoyer les espaces insecables et virgules
                      const parsed = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
                      if (!isNaN(parsed)) val = parsed;
                    }
                    
                    if (typeof val === 'number' && !isNaN(val)) {
                      result[code] = val;
                      break; // On passe au code suivant s'il y en a un autre
                    }
                  }
                }
              }
            }
          });
        });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export async function exportOfficialFodepFile(solva: import('@heyfodep/kernel').SolvabiliteAnalyse): Promise<void> {
  const response = await fetch('/FODEP_Officiel.xlsx');
  const arrayBuffer = await response.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);

  const validCodes = new Set(ALL_DEFS.filter(d => d.kind === 'input').map(d => d.code));

  wb.eachSheet((ws) => {
    ws.eachRow((row) => {
      row.eachCell((cell, colNumber) => {
        if (typeof cell.value === 'string') {
          const code = cell.value.trim();
          if (validCodes.has(code)) {
            // Chercher la première cellule non verrouillée à droite
            for (let i = colNumber + 1; i <= colNumber + 15; i++) {
              const targetCell = row.getCell(i);
              if (targetCell.protection && targetCell.protection.locked === false) {
                const val = solva.valeurs.get(code)?.toNumber();
                if (val !== undefined && val !== 0) {
                   targetCell.value = val;
                }
                break;
              }
            }
          }
        }
      });
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'FODEP_Reglementaire_Rempli.xlsx');
}
