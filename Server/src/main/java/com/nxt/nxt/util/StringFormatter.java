package com.nxt.nxt.util;

public class StringFormatter {

    public static String format(String text) {
        if (text == null || text.isEmpty()) return "";

        String[] lines = text.split("\n");
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];

            // Headers
            if (line.matches("^###\\s*\\*\\*(.*?)\\*\\*$")) {
                String headerText = line.replaceAll("^###\\s*\\*\\*(.*?)\\*\\*$", "$1");
                sb.append("<h3 style='color:#60a5fa;margin-top:1em;margin-bottom:0.5em;font-weight:bold;'>")
                  .append(formatInline(headerText)).append("</h3>");
                continue;
            }
            if (line.matches("^#+\\s*(.*?)$")) {
                int level = line.indexOf(' ');
                String headerText = line.substring(level + 1);
                sb.append("<h").append(level).append(" style='color:#60a5fa;margin-top:1em;margin-bottom:0.5em;font-weight:bold;'>")
                  .append(formatInline(headerText)).append("</h").append(level).append(">");
                continue;
            }

            // Numbered sections
            if (line.matches("^\\d+\\.\\s+(.+)")) {
                String content = line.replaceAll("^\\d+\\.\\s+", "");
                sb.append("<h4 style='color:#38bdf8;font-weight:600;margin-bottom:0.5em;'>")
                  .append(formatInline(content)).append("</h4>");
                continue;
            }

            // Subsections
            if (line.matches("^\\([a-z]\\)\\s+(.+)")) {
                String content = line.replaceAll("^\\([a-z]\\)\\s+", "");
                sb.append("<h5 style='color:#22d3ee;font-weight:500;margin-left:1em;'>")
                  .append(formatInline(content)).append("</h5>");
                continue;
            }

            // Horizontal line
            if (line.matches("^---+$")) {
                sb.append("<hr style='border-color:#4b5563;margin:1em 0;'/>");
                continue;
            }

            // Block quotes
            if (line.matches("^(Definitions:|Proof:|Conclusion:|Construction:|Correctness:|Case \\d+:|Fix the Construction:|Correct Construction:|Conversely,).*")) {
                sb.append("<div style='background:#1e293b;border-left:4px solid #3b82f6;padding:1em;margin:1em 0;border-radius:0.5em;'>")
                  .append("<strong style='color:#60a5fa;'>").append(formatInline(line)).append("</strong></div>");
                continue;
            }

            // Boxed expressions
            if (line.contains("\\boxed{")) {
                String boxed = line.replaceAll(".*\\\\boxed\\{([^}]*)\\}.*", "$1");
                sb.append("<div style='border:2px solid #22c55e;background:#16653422;padding:1em;border-radius:0.5em;text-align:center;color:#22c55e;font-weight:600;margin:1em 0;'>")
                  .append(boxed).append("</div>");
                continue;
            }

            // Code blocks
            if (line.trim().startsWith("```")) {
                StringBuilder codeBlock = new StringBuilder();
                i++;
                while (i < lines.length && !lines[i].trim().startsWith("```")) {
                    codeBlock.append(lines[i]).append("\n");
                    i++;
                }
                sb.append("<pre style='background:#374151;padding:1em;border-radius:0.5em;color:#e5e7eb;overflow-x:auto;'>")
                  .append(codeBlock.toString()).append("</pre>");
                continue;
            }

            // Lists
            if (line.matches("^\\s*[-*]\\s+.*")) {
                sb.append("<ul style='margin-left:1em;'>");
                while (i < lines.length && lines[i].matches("^\\s*[-*]\\s+.*")) {
                    String item = lines[i].replaceAll("^\\s*[-*]\\s+", "");
                    sb.append("<li>").append(formatInline(item)).append("</li>");
                    i++;
                }
                sb.append("</ul>");
                i--; // adjust for outer loop increment
                continue;
            }
            if (line.matches("^\\s*\\d+\\.\\s+.*")) {
                sb.append("<ol style='margin-left:1em;'>");
                while (i < lines.length && lines[i].matches("^\\s*\\d+\\.\\s+.*")) {
                    String item = lines[i].replaceAll("^\\s*\\d+\\.\\s+", "");
                    sb.append("<li>").append(formatInline(item)).append("</li>");
                    i++;
                }
                sb.append("</ol>");
                i--;
                continue;
            }

            // Paragraphs
            sb.append("<p>").append(formatInline(line)).append("</p>");
        }

        return sb.toString();
    }

    private static String formatInline(String text) {
        if (text == null) return "";

        // Bold
        text = text.replaceAll("\\*\\*(.*?)\\*\\*", "<strong style='font-weight:bold;'>$1</strong>");
        // Inline code
        text = text.replaceAll("`([^`]+)`", "<code style='background:#374151;padding:2px 6px;border-radius:4px;color:#facc15;'>$1</code>");
        // Boxed
        text = text.replaceAll("\\\\boxed\\{([^}]+)\\}", "<span style='border:2px solid #22c55e;background:#16653422;padding:2px 8px;border-radius:4px;color:#22c55e;font-weight:600;'>$1</span>");
        // Math (simple, not full LaTeX rendering)
        text = text.replaceAll("\\$([^$]+)\\$", "<span style='color:#38bdf8;font-family:monospace;'>$1</span>");
        text = text.replaceAll("\\\\\\((.*?)\\\\\\)", "<span style='color:#38bdf8;font-family:monospace;'>$1</span>");
        // Italic
        text = text.replaceAll("\\*(.*?)\\*", "<em>$1</em>");

        return text;
    }
}
