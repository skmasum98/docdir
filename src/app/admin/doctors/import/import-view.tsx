"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Clock,
  Zap,
  Check,
  X,
  FileText,
  HelpCircle,
  Download,
  Building2,
  Stethoscope,
  MapPin,
} from "lucide-react";
import type { BulkDoctorRow, BulkImportOptions } from "@/lib/bulk-import-service";

const SAMPLE_DHANMONDI_DATA = `Doctor Name\tDegree/Qualification\tSpeciality\tInstitute\tAddress\tArea\tUpazila/Thana Name\tDistrict Name\tPhone Number/Hotline
Sohely Akter\tMBBS FCPS(Gyn)\tObstetrics and Gynecology\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Diagnostic Center Bhaban:1, House-16 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Kamil Ara Khanom Nasrin\tMBBS DGO FCPS(Gyn)\tObstetrics and Gynecology\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center, Bhaban-3, Dhanmondi # 2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Tohid Md Saiful Hossain Dipu\tMBBS FCPS MS(Uro)\tUrology\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, House-8 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Quazi Mamtaz Uddin Ahmed\tMBBS FCPS(Med)\tMedicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Diagnostic Center Bhaban:1, House-16 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Md Rokibul Islam Rokib\tMBBS MS(Neuro)\tNeurosurgery\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Dhanmondi R/A. Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Md Mashiur Arefin Rubel\tMBBS FCPS MS(Uro)\tUrology\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Dhanmondi # 2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Zahurul Huq\tMBBS DLO\tENT\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, House-8 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Md Shahidur Rahman Sikder\tMBBS MS(Neuro)\tNeurosurgery\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Room No 602(Level 6) House 9 Road 2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Md Zillur Rahman Bhuiyan\tMBBS MPhil(Radio)\tOncology\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Dhanmondi R/A. Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Md Ahsan Ullah\tMBBS FCPS(Phy Med)\tPhysical Medicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, House-8 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Md Zahiruddin\tMBBS FCPS MD\tMedicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, House-8 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Quazi Tarikul Islam\tMBBS FCPS(Med)\tMedicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, House-8 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Tarek Mahmood\tMBBS FCPS MD(Med)\tMedicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Dhanmondi R/A. Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Saki Md Jakiul Alam\tMBBS FCPS(Med)\tMedicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, House-8 Road-2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
M Rezaul Karim\tMBBS FCPS(Med)\tMedicine\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Dhanmondi R/A. Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Farzana Rahman Rinky\tMBBS FCPS(Gyn)\tObstetrics and Gynecology\tPopular Diagnostic Center Ltd, Consultation Center, Bhaban-7\tDhanmondi # 2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
Nupur Kar\tMBBS MD(Card)\tCardiology\tPopular Diagnostic Center, Dhanmondi Branch\tPopular Consultation Center:3 Bhaban:6, Dhanmondi # 2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801
MD Jasedur Rahman\tMBBS\tGP\tPopular Physiotherapy & Rehabilitation Center\tDhanmondi # 2 Dhanmondi Dhaka\tRoad 2, Dhanmondi\tDhanmondi\tDhaka\t09666 787801`;

type ColumnMapping = {
  fullName: string;
  degrees: string;
  specialty: string;
  institute: string;
  address: string;
  area: string;
  upazila: string;
  district: string;
  phone: string;
  consultationFee: string;
  bmdcNumber: string;
};

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  fullName: "",
  degrees: "",
  specialty: "",
  institute: "",
  address: "",
  area: "",
  upazila: "",
  district: "",
  phone: "",
  consultationFee: "",
  bmdcNumber: "",
};

export function DoctorBulkImporterView() {
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parsed State
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(DEFAULT_COLUMN_MAPPING);
  const [isParsing, setIsParsing] = useState(false);

  // Configuration options
  const [options, setOptions] = useState<BulkImportOptions>({
    duplicateAction: "skip",
    defaultStatus: "PUBLISHED",
    defaultVerified: false,
    createMissingSpecialties: true,
    createMissingFacilities: true,
    createMissingLocations: true,
  });
  const [chunkSize, setChunkSize] = useState<number>(25);

  // Ingestion State
  const [isIngesting, setIsIngesting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRowsCount, setTotalRowsCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  });
  const [errorsList, setErrorsList] = useState<Array<{ rowNumber: number; doctorName?: string; error: string }>>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Control Refs
  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect column mappings from headers
  function autoMapHeaders(headers: string[]): ColumnMapping {
    const map: ColumnMapping = { ...DEFAULT_COLUMN_MAPPING };

    for (const h of headers) {
      const lower = h.toLowerCase().trim();

      // Full Name
      if (!map.fullName) {
        if (
          lower === "doctor name" ||
          lower === "doctor" ||
          lower === "name" ||
          lower === "fullname" ||
          lower === "full name" ||
          lower.includes("doctor name")
        ) {
          map.fullName = h;
        }
      }

      // Degrees
      if (!map.degrees) {
        if (
          lower.includes("degree") ||
          lower.includes("qualification") ||
          lower === "qualifications"
        ) {
          map.degrees = h;
        }
      }

      // Specialty
      if (!map.specialty) {
        if (
          lower.includes("speciality") ||
          lower.includes("specialty") ||
          lower.includes("department") ||
          lower.includes("discipline")
        ) {
          map.specialty = h;
        }
      }

      // Institute
      if (!map.institute) {
        if (
          lower.includes("institute") ||
          lower.includes("hospital") ||
          lower.includes("facility") ||
          lower.includes("chamber") ||
          lower.includes("workplace")
        ) {
          map.institute = h;
        }
      }

      // Address
      if (!map.address) {
        if (
          lower === "address" ||
          lower.includes("chamber address") ||
          lower.includes("hospital address") ||
          lower.includes("street")
        ) {
          map.address = h;
        }
      }

      // Area
      if (!map.area) {
        if (lower === "area" || lower.includes("zone") || lower.includes("road")) {
          map.area = h;
        }
      }

      // Upazila / Thana
      if (!map.upazila) {
        if (
          lower.includes("upazila") ||
          lower.includes("thana") ||
          lower.includes("upazilla")
        ) {
          map.upazila = h;
        }
      }

      // District
      if (!map.district) {
        if (lower.includes("district") || lower.includes("zila") || lower === "city") {
          map.district = h;
        }
      }

      // Phone / Hotline
      if (!map.phone) {
        if (
          lower.includes("hotline") ||
          lower.includes("phone") ||
          lower.includes("mobile") ||
          lower.includes("contact") ||
          lower.includes("cell")
        ) {
          map.phone = h;
        }
      }

      // Fee
      if (!map.consultationFee) {
        if (lower.includes("fee") || lower.includes("cost") || lower.includes("charge")) {
          map.consultationFee = h;
        }
      }

      // BMDC
      if (!map.bmdcNumber) {
        if (lower.includes("bmdc") || lower.includes("reg no") || lower.includes("license")) {
          map.bmdcNumber = h;
        }
      }
    }

    return map;
  }

  // Parse Pasted text
  function handleParsePastedText(textToParse?: string) {
    const text = textToParse !== undefined ? textToParse : pastedText;
    if (!text.trim()) return;

    setIsParsing(true);
    try {
      const parsed = Papa.parse<Record<string, string>>(text.trim(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      if (parsed.meta.fields && parsed.meta.fields.length > 0) {
        setParsedHeaders(parsed.meta.fields);
        setRawRows(parsed.data);
        setTotalRowsCount(parsed.data.length);
        const mapped = autoMapHeaders(parsed.meta.fields);
        setColumnMapping(mapped);
      }
    } catch (err) {
      console.error("Error parsing text:", err);
    } finally {
      setIsParsing(false);
    }
  }

  // Parse CSV/TSV File
  function handleFileSelected(file: File) {
    setSelectedFile(file);
    setIsParsing(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      preview: 50, // preview first 50 rows for mapping
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setParsedHeaders(results.meta.fields);
          const mapped = autoMapHeaders(results.meta.fields);
          setColumnMapping(mapped);
          setRawRows(results.data);
        }
        setIsParsing(false);
      },
      error: (err) => {
        console.error("Papa parse error:", err);
        setIsParsing(false);
      },
    });
  }

  // Map raw row to BulkDoctorRow
  function transformRow(raw: Record<string, string>): BulkDoctorRow | null {
    const name = columnMapping.fullName ? raw[columnMapping.fullName]?.trim() : "";
    if (!name) return null;

    return {
      fullName: name,
      degrees: columnMapping.degrees ? raw[columnMapping.degrees]?.trim() || null : null,
      specialty: columnMapping.specialty ? raw[columnMapping.specialty]?.trim() || null : null,
      institute: columnMapping.institute ? raw[columnMapping.institute]?.trim() || null : null,
      address: columnMapping.address ? raw[columnMapping.address]?.trim() || null : null,
      area: columnMapping.area ? raw[columnMapping.area]?.trim() || null : null,
      upazila: columnMapping.upazila ? raw[columnMapping.upazila]?.trim() || null : null,
      district: columnMapping.district ? raw[columnMapping.district]?.trim() || null : null,
      phone: columnMapping.phone ? raw[columnMapping.phone]?.trim() || null : null,
      consultationFee: columnMapping.consultationFee
        ? raw[columnMapping.consultationFee]?.trim() || null
        : null,
      bmdcNumber: columnMapping.bmdcNumber ? raw[columnMapping.bmdcNumber]?.trim() || null : null,
    };
  }

  // Helper to send batches with automatic retry for Netlify / Serverless timeouts
  async function sendBatchWithRetry(
    rows: BulkDoctorRow[],
    currentOptions: BulkImportOptions,
    startRowIndex: number,
    maxRetries = 2
  ): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{ rowNumber: number; doctorName?: string; error: string }>;
  }> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const res = await fetch("/api/admin/doctors/bulk-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows,
            options: currentOptions,
            startRowIndex,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            inserted: data.inserted || 0,
            updated: data.updated || 0,
            skipped: data.skipped || 0,
            failed: data.failed || 0,
            errors: data.errors || [],
          };
        }

        // Check if retryable status code (504, 502, 503, 500)
        if (res.status === 504 || res.status === 502 || res.status === 503 || res.status === 500) {
          attempt++;
          if (attempt <= maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
            continue;
          }
        }

        const errJson = await res.json().catch(() => ({}));
        return {
          inserted: 0,
          updated: 0,
          skipped: 0,
          failed: rows.length,
          errors: [
            {
              rowNumber: startRowIndex,
              error: errJson.error || `HTTP ${res.status} server error`,
            },
          ],
        };
      } catch (err: any) {
        attempt++;
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
        return {
          inserted: 0,
          updated: 0,
          skipped: 0,
          failed: rows.length,
          errors: [
            {
              rowNumber: startRowIndex,
              error: err.message || "Network / timeout error occurred during batch",
            },
          ],
        };
      }
    }

    return {
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: rows.length,
      errors: [{ rowNumber: startRowIndex, error: "Batch failed after retries" }],
    };
  }

  // Execute Stream Ingestion for Paste Mode or Loaded Memory Rows
  async function startMemoryIngestion() {
    if (!columnMapping.fullName) {
      alert("Please map at least the 'Doctor Name' column to proceed.");
      return;
    }

    if (rawRows.length === 0) {
      alert("No rows found to import.");
      return;
    }

    setIsIngesting(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setStartTime(Date.now());
    setErrorsList([]);
    setStats({ inserted: 0, updated: 0, skipped: 0, failed: 0 });

    const total = rawRows.length;
    setTotalRowsCount(total);

    let processed = 0;
    let localInserted = 0;
    let localUpdated = 0;
    let localSkipped = 0;
    let localFailed = 0;
    const localErrors: Array<{ rowNumber: number; doctorName?: string; error: string }> = [];

    // Chunk through rows
    for (let i = 0; i < total; i += chunkSize) {
      if (isCancelledRef.current) break;

      // Wait if paused
      while (isPausedRef.current && !isCancelledRef.current) {
        await new Promise((r) => setTimeout(r, 400));
      }

      const chunkSlice = rawRows.slice(i, i + chunkSize);
      const transformedChunk: BulkDoctorRow[] = [];

      for (const r of chunkSlice) {
        const t = transformRow(r);
        if (t) transformedChunk.push(t);
        else {
          localFailed++;
          localErrors.push({
            rowNumber: processed + 1,
            error: "Missing required Doctor Name in row",
          });
        }
      }

      if (transformedChunk.length > 0) {
        const result = await sendBatchWithRetry(transformedChunk, options, i + 1);
        localInserted += result.inserted;
        localUpdated += result.updated;
        localSkipped += result.skipped;
        localFailed += result.failed;
        if (result.errors.length > 0) {
          localErrors.push(...result.errors);
        }
        // Small yield to keep network and connection pool calm
        await new Promise((r) => setTimeout(r, 50));
      }

      processed += chunkSlice.length;
      setCurrentIndex(processed);
      setStats({
        inserted: localInserted,
        updated: localUpdated,
        skipped: localSkipped,
        failed: localFailed,
      });
      setErrorsList([...localErrors]);
    }

    setIsIngesting(false);
  }

  // Execute Stream Ingestion for Large CSV File Upload (96,400+ rows)
  async function startFileStreamIngestion() {
    if (!selectedFile) {
      alert("Please select a CSV or TSV file first.");
      return;
    }
    if (!columnMapping.fullName) {
      alert("Please map the 'Doctor Name' column.");
      return;
    }

    setIsIngesting(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;
    setStartTime(Date.now());
    setErrorsList([]);
    setStats({ inserted: 0, updated: 0, skipped: 0, failed: 0 });
    setCurrentIndex(0);

    let totalProcessedCount = 0;
    let localInserted = 0;
    let localUpdated = 0;
    let localSkipped = 0;
    let localFailed = 0;
    const localErrors: Array<{ rowNumber: number; doctorName?: string; error: string }> = [];

    let currentBatch: BulkDoctorRow[] = [];

    await new Promise<void>((resolve) => {
      Papa.parse<Record<string, string>>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        chunkSize: 1024 * 1024 * 2, // 2MB stream buffer
        chunk: async (results, parser) => {
          parser.pause();

          for (const raw of results.data) {
            const transformed = transformRow(raw);
            if (transformed) {
              currentBatch.push(transformed);
            } else {
              localFailed++;
            }

            if (currentBatch.length >= chunkSize) {
              while (isPausedRef.current && !isCancelledRef.current) {
                await new Promise((r) => setTimeout(r, 300));
              }

              if (isCancelledRef.current) {
                parser.abort();
                resolve();
                return;
              }

              const result = await sendBatchWithRetry(
                currentBatch,
                options,
                totalProcessedCount + 1
              );

              localInserted += result.inserted;
              localUpdated += result.updated;
              localSkipped += result.skipped;
              localFailed += result.failed;
              if (result.errors.length > 0) {
                localErrors.push(...result.errors);
              }

              totalProcessedCount += currentBatch.length;
              currentBatch = [];

              setCurrentIndex(totalProcessedCount);
              setStats({
                inserted: localInserted,
                updated: localUpdated,
                skipped: localSkipped,
                failed: localFailed,
              });
              setErrorsList([...localErrors]);

              // Small yield between batches
              await new Promise((r) => setTimeout(r, 50));
            }
          }

          parser.resume();
        },
        complete: async () => {
          // Process remaining batch
          if (currentBatch.length > 0 && !isCancelledRef.current) {
            const result = await sendBatchWithRetry(
              currentBatch,
              options,
              totalProcessedCount + 1
            );
            localInserted += result.inserted;
            localUpdated += result.updated;
            localSkipped += result.skipped;
            localFailed += result.failed;
            if (result.errors.length > 0) {
              localErrors.push(...result.errors);
            }
            totalProcessedCount += currentBatch.length;
          }

          setCurrentIndex(totalProcessedCount);
          setTotalRowsCount(totalProcessedCount);
          setStats({
            inserted: localInserted,
            updated: localUpdated,
            skipped: localSkipped,
            failed: localFailed,
          });
          setErrorsList([...localErrors]);
          setIsIngesting(false);
          resolve();
        },
        error: (err) => {
          console.error("Stream parse error:", err);
          setIsIngesting(false);
          resolve();
        },
      });
    });
  }

  // Timer for elapsed seconds
  useEffect(() => {
    if (!isIngesting || isPaused) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isIngesting, isPaused]);

  // Load Dhanmondi Sample
  function loadDhanmondiSample() {
    setPastedText(SAMPLE_DHANMONDI_DATA);
    handleParsePastedText(SAMPLE_DHANMONDI_DATA);
  }

  // Progress Calculation
  const progressPercent = useMemo(() => {
    if (totalRowsCount === 0) return 0;
    return Math.min(100, Math.round((currentIndex / totalRowsCount) * 100));
  }, [currentIndex, totalRowsCount]);

  // Speed & ETA
  const throughput = useMemo(() => {
    if (elapsedSeconds === 0 || currentIndex === 0) return 0;
    return Math.round(currentIndex / elapsedSeconds);
  }, [currentIndex, elapsedSeconds]);

  const estimatedSecondsLeft = useMemo(() => {
    if (throughput === 0 || totalRowsCount === 0) return null;
    const remaining = totalRowsCount - currentIndex;
    if (remaining <= 0) return 0;
    return Math.round(remaining / throughput);
  }, [currentIndex, totalRowsCount, throughput]);

  // Export Errors CSV
  function downloadErrorLog() {
    if (errorsList.length === 0) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Row Number,Doctor Name,Error Reason", ...errorsList.map((e) => `${e.rowNumber},"${e.doctorName || ""}", "${e.error.replace(/"/g, '""')}"`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `import-errors-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-900">
              <Zap className="h-3.5 w-3.5 text-indigo-700" />
              <span>High-Capacity Doctor Ingestion Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Bulk Doctor Importer (1 to 100k+ Records)
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Stream-import large doctor datasets from CSV, TSV, or spreadsheet copy-paste. Automatically resolves medical specialties, locations (Division $\rightarrow$ District $\rightarrow$ Upazila/Thana), creates missing clinic facilities, and generates collision-free URL slugs.
            </p>
          </div>

          <Link
            href="/admin/doctors"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <span>Back to Doctors List</span>
          </Link>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "paste"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Paste Table / TSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "upload"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Large CSV / TSV File (96k+ Scale)</span>
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {activeTab === "paste" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                Paste Rows from Excel / Google Sheets / TSV
              </label>

              <button
                type="button"
                onClick={loadDhanmondiSample}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                <span>Load Dhanmondi 18 Doctors Sample</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste table data with header row here (Doctor Name, Degree, Speciality, Institute, Address, Area, Upazila/Thana Name, District Name)..."
              className="w-full font-mono text-xs rounded-2xl border border-slate-300 p-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleParsePastedText()}
                disabled={!pastedText.trim() || isParsing}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
              >
                <Layers className="h-4 w-4" />
                <span>{isParsing ? "Analyzing Columns..." : "Parse & Preview Data"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-indigo-600" />
              Upload National Doctor Dataset (.csv or .tsv)
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 text-center hover:border-indigo-500 hover:bg-indigo-50/20 transition cursor-pointer space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />
              <UploadCloud className="h-10 w-10 text-indigo-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedFile ? selectedFile.name : "Click to select or drop CSV/TSV file"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB file ready for chunk streaming`
                    : "Supports 96,400+ rows. High-throughput client worker chunking."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Column Mapping Section */}
        {parsedHeaders.length > 0 && (
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Column Mapping ({parsedHeaders.length} columns detected in file)
              </h3>
              <span className="text-xs text-slate-500">
                Mapped automatically. Adjust if your header names differ.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Doctor Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={columnMapping.fullName}
                  onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Select Column --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Degree / Qualification</label>
                <select
                  value={columnMapping.degrees}
                  onChange={(e) => setColumnMapping({ ...columnMapping, degrees: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specialty</label>
                <select
                  value={columnMapping.specialty}
                  onChange={(e) => setColumnMapping({ ...columnMapping, specialty: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital / Institute</label>
                <select
                  value={columnMapping.institute}
                  onChange={(e) => setColumnMapping({ ...columnMapping, institute: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Chamber</label>
                <select
                  value={columnMapping.address}
                  onChange={(e) => setColumnMapping({ ...columnMapping, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Area / Road</label>
                <select
                  value={columnMapping.area}
                  onChange={(e) => setColumnMapping({ ...columnMapping, area: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Upazila / Thana</label>
                <select
                  value={columnMapping.upazila}
                  onChange={(e) => setColumnMapping({ ...columnMapping, upazila: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">District</label>
                <select
                  value={columnMapping.district}
                  onChange={(e) => setColumnMapping({ ...columnMapping, district: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Optional / None --</option>
                  {parsedHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Ingestion Settings & Batch Tuning */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs">
          <p className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
            Ingestion Controls & Behavior
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duplicate Handling</label>
              <select
                value={options.duplicateAction}
                onChange={(e) =>
                  setOptions({ ...options, duplicateAction: e.target.value as "skip" | "update" })
                }
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
              >
                <option value="skip">Skip duplicates (Safe & Fast)</option>
                <option value="update">Update existing records</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Publish Status</label>
              <select
                value={options.defaultStatus}
                onChange={(e) =>
                  setOptions({ ...options, defaultStatus: e.target.value as "PUBLISHED" | "DRAFT" })
                }
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
              >
                <option value="PUBLISHED">Published (Visible immediately)</option>
                <option value="DRAFT">Draft (Requires admin review)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">BMDC Verification Badge</label>
              <select
                value={options.defaultVerified ? "true" : "false"}
                onChange={(e) =>
                  setOptions({ ...options, defaultVerified: e.target.value === "true" })
                }
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
              >
                <option value="false">Unverified (No Verified Badge)</option>
                <option value="true">Verified (Attach Verified Badge)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Chunk Size</label>
              <select
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
              >
                <option value={10}>10 rows (Ultra-Safe / High Latency)</option>
                <option value={25}>25 rows (Recommended for Netlify / Serverless)</option>
                <option value={50}>50 rows (Balanced Speed)</option>
                <option value={100}>100 rows (Fast)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {parsedHeaders.length > 0 && !isIngesting && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Ready to import <strong>{rawRows.length > 0 ? rawRows.length : "all streamable"}</strong> rows.
            </div>

            <button
              type="button"
              onClick={activeTab === "paste" ? startMemoryIngestion : startFileStreamIngestion}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              <Play className="h-4 w-4" />
              <span>Start Bulk Ingestion Engine</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Ingestion Dashboard */}
      {(isIngesting || currentIndex > 0) && (
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" />
                Ingestion Engine Status: {isIngesting ? (isPaused ? "Paused" : "Processing...") : "Completed"}
              </h2>
              <p className="text-xs text-slate-500">
                {throughput > 0 && `Streaming at ~${throughput} rows/sec · `}
                {estimatedSecondsLeft !== null &&
                  estimatedSecondsLeft > 0 &&
                  `Estimated time remaining: ~${Math.ceil(estimatedSecondsLeft / 60)} min (${estimatedSecondsLeft}s)`}
              </p>
            </div>

            {/* Ingestion Controls */}
            {isIngesting && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    isPausedRef.current = !isPaused;
                    setIsPaused(!isPaused);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                >
                  {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                  <span>{isPaused ? "Resume" : "Pause"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    isCancelledRef.current = true;
                    setIsIngesting(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>
                Processed {currentIndex.toLocaleString()} {totalRowsCount > 0 && `of ${totalRowsCount.toLocaleString()}`}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Metrics Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-xl font-extrabold text-emerald-900">{stats.inserted.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mt-0.5">
                New Doctors Created
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
              <p className="text-xl font-extrabold text-blue-900">{stats.updated.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mt-0.5">
                Records Updated
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xl font-extrabold text-slate-700">{stats.skipped.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                Duplicates Skipped
              </p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
              <p className="text-xl font-extrabold text-rose-900">{stats.failed.toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide mt-0.5">
                Failed Rows
              </p>
            </div>
          </div>

          {/* Error / Warning Details */}
          {errorsList.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorsList.length} Failed Rows / Warnings</span>
                </span>
                <button
                  type="button"
                  onClick={downloadErrorLog}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  <Download className="h-3 w-3" />
                  <span>Download Error Log (.csv)</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-2xl border border-rose-200 bg-rose-50/30 p-3 text-xs divide-y divide-rose-100 font-mono">
                {errorsList.slice(0, 30).map((err, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                    <span className="text-slate-600">
                      Row #{err.rowNumber} {err.doctorName ? `(${err.doctorName})` : ""}:
                    </span>
                    <span className="text-rose-700 font-medium truncate max-w-md">{err.error}</span>
                  </div>
                ))}
                {errorsList.length > 30 && (
                  <p className="text-center py-2 text-slate-500">
                    ...and {errorsList.length - 30} more errors. Download log to view full details.
                  </p>
                )}
              </div>
            </div>
          )}

          {!isIngesting && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Ingestion cycle finished. Doctors are indexed and live in directory!</span>
              </span>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/doctors"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  <span>View All Doctors</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/search"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <span>Test Search Directory</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Table of First Few Rows */}
      {rawRows.length > 0 && !isIngesting && (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Data Preview (First 5 of {rawRows.length.toLocaleString()} rows)
            </h3>
            <span className="text-xs text-slate-400">Review mapped columns before starting</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3">#</th>
                  <th className="p-3">Doctor Name</th>
                  <th className="p-3">Degree</th>
                  <th className="p-3">Specialty</th>
                  <th className="p-3">Institute</th>
                  <th className="p-3">Location (Thana, District)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawRows.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">
                      {columnMapping.fullName ? row[columnMapping.fullName] || "—" : "—"}
                    </td>
                    <td className="p-3 text-slate-600">
                      {columnMapping.degrees ? row[columnMapping.degrees] || "—" : "—"}
                    </td>
                    <td className="p-3 text-indigo-700 font-semibold">
                      {columnMapping.specialty ? row[columnMapping.specialty] || "—" : "—"}
                    </td>
                    <td className="p-3 text-slate-700">
                      {columnMapping.institute ? row[columnMapping.institute] || "—" : "—"}
                    </td>
                    <td className="p-3 text-slate-600">
                      {columnMapping.upazila ? row[columnMapping.upazila] : ""}{" "}
                      {columnMapping.district ? `, ${row[columnMapping.district]}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
