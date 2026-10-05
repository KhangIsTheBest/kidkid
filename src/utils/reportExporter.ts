import { Document, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, AlignmentType, BorderStyle, Packer } from 'docx';
import { saveAs } from 'file-saver';
import { Student, AssessmentSession } from '../types/assessment';
import { abllsData, calculateAgeMonths, getNormsIntervalIndex } from './storage';

export async function exportWordReport(student: Student, session: AssessmentSession) {
  const ageInfo = calculateAgeMonths(student.dob, session.assessmentDate);
  const normIdx = getNormsIntervalIndex(ageInfo.totalMonths);
  const normIntervalName = abllsData.norms_intervals[normIdx] || `${ageInfo.totalMonths}T`;

  // Calculate stats per repertoire
  const repStats = abllsData.repertoires.map(rep => {
    let earned = 0;
    const repSkills = abllsData.skills.filter(s => s.repertoire_code === rep.code);
    repSkills.forEach(s => {
      const score = session.scores[s.code] || 0;
      earned += score;
    });
    const percentage = rep.total_points > 0 ? (earned / rep.total_points) * 100 : 0;
    
    // Norm benchmark
    let normBenchmark = 0;
    const normEntry = abllsData.norms[rep.code];
    if (normEntry && normEntry.values && normEntry.values.length > normIdx) {
      normBenchmark = normEntry.values[normIdx] * 100;
    }

    return {
      code: rep.code,
      name: rep.name,
      name_en: rep.name_en,
      earned,
      total: rep.total_points,
      percentage: Math.round(percentage),
      normBenchmark: Math.round(normBenchmark)
    };
  });

  const totalEarned = repStats.reduce((acc, r) => acc + r.earned, 0);
  const totalMax = repStats.reduce((acc, r) => acc + r.total, 0);
  const totalPercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  // Build Word Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "ASSESSMENT REPORT",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "BÁO CÁO ĐÁNH GIÁ NĂNG LỰC PHÁT TRIỂN",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),

          // Child Information Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Họ và tên trẻ / Full Name:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: student.fullName })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Ngày sinh / DOB:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: `${student.dob} (${ageInfo.years} tuổi ${ageInfo.months} tháng)` })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Người đánh giá / Assessor:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: session.assessorName || "Giáo viên chuyên môn" })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Ngày đánh giá / Date:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: `${session.assessmentDate} (Đợt ${session.roundNumber})` })] }),
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đơn vị / Cơ sở can thiệp:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: student.classOrCenter || "Trung tâm Giáo dục Đặc biệt" })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chẩn đoán ban đầu:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: student.diagnosis || "Chưa có kết luận y khoa" })] }),
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Measures Taken Section
          new Paragraph({
            children: [
              new TextRun({ text: "MEASURES TAKEN / CÔNG CỤ SỬ DỤNG", bold: true, size: 24 })
            ],
            spacing: { before: 200, after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "The ABLLS-R (Assessment of Basic Language and Learning Skills - Revised) is a comprehensive criterion-referenced assessment covering 544 skills across 25 repertoires, including language, cognition, social interaction, self-help, motor and academic readiness. Results are interpreted to guide individualized intervention and track developmental progress over time.",
                italics: true
              })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "ABLLS-R là bộ công cụ đánh giá kỹ năng học tập và ngôn ngữ cơ bản theo tiêu chí, khảo sát 544 kỹ năng thuộc 25 nhóm lĩnh vực. Dữ liệu đánh giá cung cấp bức tranh rõ nét về điểm mạnh, điểm hạn chế của trẻ so với mốc tuổi chuẩn (Norms theo Partington, 2010), từ đó làm căn cứ thiết lập Mục tiêu Can thiệp Cá nhân (IEP).",
              })
            ],
            spacing: { after: 200 }
          }),

          // Brief Results Section
          new Paragraph({
            children: [
              new TextRun({ text: "BRIEF RESULTS / KẾT QUẢ NGẮN GỌN THEO LĨNH VỰC", bold: true, size: 24 })
            ],
            spacing: { before: 200, after: 120 }
          }),

          // Repertoires Result Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mã", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Lĩnh vực kỹ năng", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Điểm đạt", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tối đa", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Đạt (%)", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Chuẩn ${normIntervalName} (%)`, bold: true })] })] }),
                ]
              }),
              ...repStats.map(r => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: r.code })] }),
                  new TableCell({ children: [new Paragraph({ text: `${r.name} (${r.name_en})` })] }),
                  new TableCell({ children: [new Paragraph({ text: String(r.earned) })] }),
                  new TableCell({ children: [new Paragraph({ text: String(r.total) })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${r.percentage}%`, bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: `${r.normBenchmark}%` })] }),
                ]
              })),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TỔNG", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TỔNG HỢP TOÀN BỘ 25 LĨNH VỰC", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totalEarned), bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(totalMax), bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalPercent}%`, bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ text: "-" })] }),
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // General Assessment
          new Paragraph({
            children: [
              new TextRun({ text: "GENERAL ASSESSMENT / ĐÁNH GIÁ TỔNG QUAN NĂNG LỰC HIỆN TẠI", bold: true, size: 24 })
            ],
            spacing: { before: 200, after: 120 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Nhận định chung: ", bold: true }),
              new TextRun({ text: session.generalSummary || "Trẻ có tiềm năng học hỏi, phản hồi tích cực với các phương pháp gợi ý hình ảnh và khen thưởng trực quan." })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. Điểm mạnh nổi bật: ", bold: true }),
              new TextRun({ text: session.strengths || "Hợp tác tốt trong các trò chơi vận động; có khả năng bắt chước hành động đơn giản khi được hướng dẫn 1-1." })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Điểm cần tập trung hỗ trợ: ", bold: true }),
              new TextRun({ text: session.challenges || "Kỹ năng yêu cầu (Mands), nói theo (Echoic), và duy trì chú ý chung trong nhóm còn gặp nhiều thách thức." })
            ],
            spacing: { after: 200 }
          }),

          // Priority Goals (IEP)
          new Paragraph({
            children: [
              new TextRun({ text: "PRIORITY INTERVENTION GOALS / MỤC TIÊU ƯU TIÊN CAN THIỆP (IEP)", bold: true, size: 24 })
            ],
            spacing: { before: 200, after: 120 }
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mã bài", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mục tiêu kỹ năng", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Ưu tiên", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Khung thời gian", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Chiến lược can thiệp đề xuất", bold: true })] })] }),
                ]
              }),
              ...(session.iepGoals.length > 0 ? session.iepGoals.map(goal => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: goal.skillCode })] }),
                  new TableCell({ children: [new Paragraph({ text: goal.skillTitle })] }),
                  new TableCell({ children: [new Paragraph({ text: goal.priority })] }),
                  new TableCell({ children: [new Paragraph({ text: goal.timeframe })] }),
                  new TableCell({ children: [new Paragraph({ text: goal.interventionStrategy })] }),
                ]
              })) : [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "-" })] }),
                    new TableCell({ children: [new Paragraph({ text: "Chưa cấu hình mục tiêu IEP" })] }),
                    new TableCell({ children: [new Paragraph({ text: "-" })] }),
                    new TableCell({ children: [new Paragraph({ text: "-" })] }),
                    new TableCell({ children: [new Paragraph({ text: "-" })] }),
                  ]
                })
              ])
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "NGƯỜI LẬP BÁO CÁO", bold: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", italics: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "", spacing: { after: 600 } }),
                      new Paragraph({ text: session.assessorName || "Giáo viên", alignment: AlignmentType.CENTER }),
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "BAN CHUYÊN MÔN / TRUNG TÂM", bold: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "(Ký và đóng dấu)", italics: true })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "", spacing: { after: 600 } }),
                      new Paragraph({ text: student.classOrCenter || "Ban Chuyên Môn", alignment: AlignmentType.CENTER }),
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeName = student.fullName.replace(/\s+/g, '_');
  const filename = `${safeName}_ABLLS_REPORT_${session.assessmentDate}.docx`;
  saveAs(blob, filename);
}
