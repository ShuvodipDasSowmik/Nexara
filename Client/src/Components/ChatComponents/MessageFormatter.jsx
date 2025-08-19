import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

const MessageFormatter = ({ text, isUser }) => {
  if (isUser) {
    // User messages are displayed as plain text
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  // Format AI messages with markdown-like syntax
  const formatMessage = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (line.trim() === '') {
        elements.push(<br key={i} />);
        i++;
        continue;
      }

      // Headers (### **text** or # text)
      if (line.match(/^###\s*\*\*(.*?)\*\*$/)) {
        const headerText = line.match(/^###\s*\*\*(.*?)\*\*$/)[1];
        elements.push(
          <h3 key={i} className="text-lg font-bold text-blue-300 mt-4 mb-2">
            {formatInlineText(headerText)}
          </h3>
        );
        i++;
        continue;
      }

      // Numbered sections (1., 2., etc.) at start of line
      if (line.match(/^\d+\.\s+(.+)/)) {
        const sectionMatch = line.match(/^(\d+\.\s+)(.+)/);
        const content = sectionMatch[2];
        
        elements.push(
          <div key={i} className="mb-3">
            <h4 className="text-blue-400 font-semibold mb-2">
              <span className="text-blue-300">{sectionMatch[1]}</span>
              {formatInlineText(content)}
            </h4>
          </div>
        );
        i++;
        continue;
      }

      // Subsections with (a), (b), etc.
      if (line.match(/^\([a-z]\)\s+(.+)/)) {
        const subMatch = line.match(/^(\([a-z]\)\s+)(.+)/);
        elements.push(
          <div key={i} className="mb-2 ml-4">
            <h5 className="text-cyan-400 font-medium">
              <span className="text-cyan-300">{subMatch[1]}</span>
              {formatInlineText(subMatch[2])}
            </h5>
          </div>
        );
        i++;
        continue;
      }
      if (line.match(/^#+\s*(.*?)$/)) {
        const headerMatch = line.match(/^(#+)\s*(.*?)$/);
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        
        const HeaderTag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
        const sizeClass = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-md';
        
        elements.push(
          <HeaderTag key={i} className={`${sizeClass} font-bold text-blue-300 mt-4 mb-2`}>
            {formatInlineText(headerText)}
          </HeaderTag>
        );
        i++;
        continue;
      }

      // Block math expressions \\[ ... \\] or $$ ... $$
      if (line.trim().startsWith('\\[') || line.trim().startsWith('$$')) {
        const mathLines = [];
        let j = i;
        const isDoubleDollar = line.trim().startsWith('$$');
        const endPattern = isDoubleDollar ? '$$' : '\\]';
        
        // If opening and closing are on the same line
        if ((isDoubleDollar && line.includes('$$', 2)) || (!isDoubleDollar && line.includes('\\]'))) {
          let mathContent = line;
          if (isDoubleDollar) {
            mathContent = line.replace(/^\s*\$\$/, '').replace(/\$\$\s*$/, '');
          } else {
            mathContent = line.replace(/^\s*\\\[/, '').replace(/\\\]\s*$/, '');
          }
          
          elements.push(
            <div key={i} className="my-4 text-center">
              <BlockMath math={mathContent.trim()} />
            </div>
          );
          i++;
          continue;
        }
        
        // Multi-line math block
        let mathContent = line.replace(/^\s*(\$\$|\\\[)/, '');
        j++;
        
        while (j < lines.length && !lines[j].trim().endsWith(endPattern)) {
          mathContent += '\n' + lines[j];
          j++;
        }
        
        if (j < lines.length) {
          mathContent += '\n' + lines[j].replace(new RegExp(endPattern + '\\s*$'), '');
          j++;
        }

        elements.push(
          <div key={i} className="my-4 text-center">
            <BlockMath math={mathContent.trim()} />
          </div>
        );
        i = j;
        continue;
      }

      // Mathematical expressions and LaTeX (\\( ... \\) or \( ... \))
      if (line.includes('\\(') && line.includes('\\)')) {
        elements.push(
          <p key={i} className="mb-2">
            {formatMathText(line)}
          </p>
        );
        i++;
        continue;
      }

      // Horizontal line separators (---)
      if (line.match(/^---+$/)) {
        elements.push(
          <hr key={i} className="border-gray-600 my-4" />
        );
        i++;
        continue;
      }

      // Block quotes or special formatting (lines starting with specific patterns)
      if (line.match(/^(Definitions:|Proof:|Conclusion:|Construction:|Correctness:|Case \d+:|Fix the Construction:|Correct Construction:|Conversely,)/)) {
        elements.push(
          <div key={i} className="bg-gray-750 border-l-4 border-blue-500 p-3 my-2 rounded-r-md">
            <p className="font-semibold text-blue-300">
              {formatInlineText(line)}
            </p>
          </div>
        );
        i++;
        continue;
      }

      // Boxed expressions \\boxed{...}
      if (line.includes('\\boxed{')) {
        elements.push(
          <div key={i} className="my-4 p-4 border-2 border-green-500 bg-green-900/20 rounded-lg text-center">
            <p className="text-green-300 font-semibold">
              {formatInlineText(line)}
            </p>
          </div>
        );
        i++;
        continue;
      }
      if (line.includes('|') && line.split('|').length > 2) {
        const tableLines = [];
        let j = i;
        
        // Collect all table lines
        while (j < lines.length && lines[j].includes('|') && lines[j].split('|').length > 2) {
          tableLines.push(lines[j]);
          j++;
        }

        if (tableLines.length > 1) {
          elements.push(renderTable(tableLines, i));
          i = j;
          continue;
        }
      }

      // Code blocks (```text```)
      if (line.trim().startsWith('```')) {
        const codeLines = [];
        i++; // Skip opening ```
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        if (i < lines.length) i++; // Skip closing ```

        elements.push(
          <pre key={i} className="bg-gray-700 p-3 rounded-md my-2 overflow-x-auto">
            <code className="text-sm text-gray-200">
              {codeLines.join('\n')}
            </code>
          </pre>
        );
        continue;
      }

      // Lists (- item or 1. item or special numbered lists)
      if (line.match(/^\s*[-*]\s+/) || line.match(/^\s*\d+\.\s+/) || line.match(/^#\s*\d+\./)) {
        const listItems = [];
        let j = i;
        const isOrdered = line.match(/^\s*\d+\.\s+/) || line.match(/^#\s*\d+\./);

        // Collect all list items
        while (j < lines.length && (lines[j].match(/^\s*[-*]\s+/) || lines[j].match(/^\s*\d+\.\s+/) || lines[j].match(/^#\s*\d+\./))) {
          let itemText = lines[j]
            .replace(/^\s*[-*]\s+/, '')
            .replace(/^\s*\d+\.\s+/, '')
            .replace(/^#\s*\d+\.\s*/, '');
          
          listItems.push(
            <li key={j} className="mb-2">
              {formatInlineText(itemText)}
            </li>
          );
          j++;
        }

        const ListTag = isOrdered ? 'ol' : 'ul';
        const listClass = isOrdered ? 'list-decimal list-inside ml-4 space-y-1' : 'list-disc list-inside ml-4 space-y-1';

        elements.push(
          <ListTag key={i} className={`${listClass} mb-3`}>
            {listItems}
          </ListTag>
        );
        i = j;
        continue;
      }

      // Regular paragraphs with inline math
      elements.push(
        <p key={i} className="mb-2">
          {formatInlineText(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Format mathematical expressions and LaTeX
  const formatMathText = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Block math expressions in text (standalone math on lines)
      const blockMathMatch = remaining.match(/^([^\\]*?)([A-Z∀∃∑∏∫][^=]*?=.*?)$/);
      if (blockMathMatch && blockMathMatch[2].length > 10) {
        const beforeMath = blockMathMatch[1];
        const mathContent = blockMathMatch[2];
        
        if (beforeMath.trim()) {
          parts.push(<span key={key++}>{formatInlineText(beforeMath)}</span>);
        }
        
        try {
          // Convert common symbols for KaTeX
          let katexContent = mathContent
            .replace(/∪/g, '\\cup')
            .replace(/∩/g, '\\cap')
            .replace(/∈/g, '\\in')
            .replace(/∉/g, '\\notin')
            .replace(/⊆/g, '\\subseteq')
            .replace(/∣/g, '\\mid')
            .replace(/′/g, "'")
            .replace(/∖/g, '\\setminus')
            .replace(/∑/g, '\\sum')
            .replace(/∏/g, '\\prod')
            .replace(/∫/g, '\\int')
            .replace(/∞/g, '\\infty')
            .replace(/≤/g, '\\leq')
            .replace(/≥/g, '\\geq')
            .replace(/≠/g, '\\neq')
            .replace(/·/g, '\\cdot');
          
          parts.push(
            <div key={key++} className="my-2 text-center">
              <BlockMath math={katexContent} />
            </div>
          );
        } catch (error) {
          parts.push(
            <div key={key++} className="bg-gray-800 p-2 rounded text-blue-200 font-mono text-sm border border-gray-600 my-2">
              {mathContent}
            </div>
          );
        }
        
        remaining = '';
        continue;
      }

      // LaTeX inline math \\( ... \\) or \( ... \)
      const mathMatch = remaining.match(/\\\((.*?)\\\)/);
      if (mathMatch) {
        const beforeMath = remaining.substring(0, mathMatch.index);
        if (beforeMath) {
          parts.push(<span key={key++}>{formatInlineText(beforeMath)}</span>);
        }
        
        try {
          parts.push(
            <InlineMath key={key++} math={mathMatch[1]} />
          );
        } catch (error) {
          parts.push(
            <span key={key++} className="bg-gray-800 px-2 py-1 rounded text-blue-200 font-mono text-sm border border-gray-600">
              {mathMatch[1]}
            </span>
          );
        }
        
        remaining = remaining.substring(mathMatch.index + mathMatch[0].length);
        continue;
      }

      // No more math found, format the rest normally
      parts.push(<span key={key++}>{formatInlineText(remaining)}</span>);
      break;
    }

    return parts;
  };

  // Format inline text with bold, italic, code, etc.
  const formatInlineText = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    // Debug logging
    if (text.includes('\\(')) {
      console.log('Processing text with LaTeX:', text);
    }

    while (remaining.length > 0) {
      // LaTeX inline math \\( ... \\) or \( ... \) or standalone math expressions ending with \
      const mathMatch = remaining.match(/\\\((.*?)\\\)/);
      if (mathMatch) {
        console.log('Found math match:', mathMatch[1]);
        const beforeMath = remaining.substring(0, mathMatch.index);
        if (beforeMath) {
          parts.push(<span key={key++}>{beforeMath}</span>);
        }
        
        try {
          parts.push(
            <InlineMath key={key++} math={mathMatch[1]} />
          );
          console.log('Successfully rendered with KaTeX:', mathMatch[1]);
        } catch (error) {
          console.log('KaTeX error:', error, 'for expression:', mathMatch[1]);
          // Fallback if KaTeX fails to render
          parts.push(
            <span key={key++} className="bg-gray-800 px-1 py-0.5 rounded text-blue-200 font-mono text-sm border border-gray-600 mx-1">
              {mathMatch[1]}
            </span>
          );
        }
        
        remaining = remaining.substring(mathMatch.index + mathMatch[0].length);
        continue;
      }

      // Standalone math expressions ending with \ (like (a + b)^2 = a^2 + 2ab + b^2 \)
      const standaloneMathMatch = remaining.match(/^(.+)\s*\\\s*$/);
      if (standaloneMathMatch && (remaining.includes('=') || remaining.includes('^') || remaining.includes('_'))) {
        try {
          parts.push(
            <div key={key++} className="my-2">
              <InlineMath math={standaloneMathMatch[1].trim()} />
            </div>
          );
        } catch (error) {
          // Fallback to styled display
          parts.push(
            <div key={key++} className="my-2 bg-gray-800 px-3 py-2 rounded text-blue-200 font-mono border border-gray-600">
              {standaloneMathMatch[1].trim()}
            </div>
          );
        }
        remaining = '';
        continue;
      }

      // Dollar sign math $...$
      const dollarMathMatch = remaining.match(/\$([^$]+)\$/);
      if (dollarMathMatch) {
        const beforeMath = remaining.substring(0, dollarMathMatch.index);
        if (beforeMath) {
          parts.push(<span key={key++}>{beforeMath}</span>);
        }
        
        try {
          parts.push(
            <InlineMath key={key++} math={dollarMathMatch[1]} />
          );
        } catch (error) {
          // Fallback if KaTeX fails to render
          parts.push(
            <span key={key++} className="bg-gray-800 px-1 py-0.5 rounded text-blue-200 font-mono text-sm border border-gray-600 mx-1">
              {dollarMathMatch[1]}
            </span>
          );
        }
        
        remaining = remaining.substring(dollarMathMatch.index + dollarMathMatch[0].length);
        continue;
      }

      // Boxed expressions \\boxed{...}
      const boxedMatch = remaining.match(/\\boxed\{([^}]+)\}/);
      if (boxedMatch) {
        const beforeBoxed = remaining.substring(0, boxedMatch.index);
        if (beforeBoxed) {
          parts.push(<span key={key++}>{beforeBoxed}</span>);
        }
        
        parts.push(
          <span key={key++} className="inline-block px-3 py-1 border-2 border-green-500 bg-green-900/20 rounded text-green-300 font-semibold mx-1">
            {boxedMatch[1]}
          </span>
        );
        remaining = remaining.substring(boxedMatch.index + boxedMatch[0].length);
        continue;
      }

      // Bold text **text**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        const beforeBold = remaining.substring(0, boldMatch.index);
        if (beforeBold) {
          parts.push(<span key={key++}>{beforeBold}</span>);
        }
        parts.push(
          <strong key={key++} className="font-bold text-white">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Inline code `code`
      const codeMatch = remaining.match(/`([^`]+)`/);
      if (codeMatch) {
        const beforeCode = remaining.substring(0, codeMatch.index);
        if (beforeCode) {
          parts.push(<span key={key++}>{beforeCode}</span>);
        }
        parts.push(
          <code key={key++} className="bg-gray-700 px-2 py-1 rounded text-sm text-yellow-300 border border-gray-600">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.substring(codeMatch.index + codeMatch[0].length);
        continue;
      }

      // Mathematical symbols that should be rendered specially
      const mathSymbols = ['∪', '∩', '∈', '∉', '⊆', '⊂', '∖', '∑', '∏', '∫', '∞', '≤', '≥', '≠', '≈', '≡', '′', '∣'];
      let mathSymbolFound = false;
      
      for (const symbol of mathSymbols) {
        if (remaining.startsWith(symbol)) {
          parts.push(
            <span key={key++} className="text-blue-300 font-mono text-lg mx-0.5">
              {symbol}
            </span>
          );
          remaining = remaining.substring(symbol.length);
          mathSymbolFound = true;
          break;
        }
      }

      if (mathSymbolFound) continue;

      // Special mathematical symbols and expressions
      const symbolMap = {
        '\\subseteq': '⊆',
        '\\subset': '⊂',
        '\\cup': '∪',
        '\\cap': '∩',
        '\\setminus': '∖',
        '\\sum': 'Σ',
        '\\prod': 'Π',
        '\\int': '∫',
        '\\infty': '∞',
        '\\alpha': 'α',
        '\\beta': 'β',
        '\\gamma': 'γ',
        '\\delta': 'δ',
        '\\epsilon': 'ε',
        '\\lambda': 'λ',
        '\\mu': 'μ',
        '\\pi': 'π',
        '\\sigma': 'σ',
        '\\tau': 'τ',
        '\\phi': 'φ',
        '\\omega': 'ω',
        '\\leq': '≤',
        '\\geq': '≥',
        '\\neq': '≠',
        '\\approx': '≈',
        '\\equiv': '≡',
        '\\square': '□',
        '\\cdot': '·'
      };

      let symbolFound = false;
      for (const [latex, symbol] of Object.entries(symbolMap)) {
        if (remaining.startsWith(latex)) {
          parts.push(
            <span key={key++} className="text-blue-200 font-mono">
              {symbol}
            </span>
          );
          remaining = remaining.substring(latex.length);
          symbolFound = true;
          break;
        }
      }

      if (symbolFound) continue;

      // No more formatting found, add the rest
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    return parts;
  };

  // Render table
  const renderTable = (tableLines, keyBase) => {
    const rows = tableLines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
    );

    if (rows.length < 2) return null;

    const headers = rows[0];
    const dataRows = rows.slice(2); // Skip header and separator line

    return (
      <div key={keyBase} className="overflow-x-auto my-3">
        <table className="min-w-full border-collapse border border-gray-600">
          <thead>
            <tr className="bg-gray-700">
              {headers.map((header, idx) => (
                <th key={idx} className="border border-gray-600 px-3 py-2 text-left font-semibold text-gray-200">
                  {formatInlineText(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="bg-gray-800 hover:bg-gray-750">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-gray-600 px-3 py-2 text-gray-300">
                    {formatInlineText(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="message-content">
      {formatMessage(text)}
    </div>
  );
};

export default MessageFormatter;
