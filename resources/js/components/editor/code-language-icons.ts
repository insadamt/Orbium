import {
    siGit,
    siPostgresql,
    siVim,
    siOpenscad,
    siLlvm,
    siStylus,
    siAda,
    siAutohotkey,
    siAutoit,
    siCoffeescript,
    siElm,
    siReason,
    siVala,
    siGradle,
    siHandlebarsdotjs,
    siCrystal,
    siD,
    siHaxe,
    siDelphi,
    siNim,
    siLatex,
    siApache,
    siClojure,
    siCmake,
    siDart,
    siDocker,
    siElixir,
    siErlang,
    siFortran,
    siFsharp,
    siApachegroovy,
    siHaskell,
    siJulia,
    siNginx,
    siOcaml,
    siScala,
    siToml,
    siArduino,
    siGraphql,
    siKotlin,
    siLess,
    siLua,
    siMarkdown,
    siPerl,
    siR,
    siRuby,
    siSass,
    siSwift,
    siWebassembly,
    siXml,
    siPhp,
    siJavascript,
    siTypescript,
    siPython,
    siRust,
    siGo,
    siC,
    siCplusplus,
    siHtml5,
    siCss,
    siGnubash,
    siJson,
    siYaml,
} from 'simple-icons';
import { normalizeCodeLanguage } from './code-languages';
import { deviconLanguagePaths } from './language-icons/devicon-language-paths';

const iconPaths: Record<string, string> = {
    git: siGit.path,
    pgsql: siPostgresql.path,
    vim: siVim.path,
    openscad: siOpenscad.path,
    llvm: siLlvm.path,
    stylus: siStylus.path,

    ada: siAda.path,
    autohotkey: siAutohotkey.path,
    autoit: siAutoit.path,
    coffeescript: siCoffeescript.path,
    elm: siElm.path,
    reasonml: siReason.path,
    vala: siVala.path,

    gradle: siGradle.path,
    handlebars: siHandlebarsdotjs.path,
    crystal: siCrystal.path,
    d: siD.path,
    haxe: siHaxe.path,
    delphi: siDelphi.path,

    nim: siNim.path,
    latex: siLatex.path,
    apache: siApache.path,
    jsx: siJavascript.path,
    tsx: siTypescript.path,
    clojure: siClojure.path,
    cmake: siCmake.path,
    dart: siDart.path,
    dockerfile: siDocker.path,
    elixir: siElixir.path,
    erlang: siErlang.path,
    fortran: siFortran.path,
    fsharp: siFsharp.path,
    groovy: siApachegroovy.path,
    haskell: siHaskell.path,
    julia: siJulia.path,
    nginx: siNginx.path,
    ocaml: siOcaml.path,
    scala: siScala.path,
    toml: siToml.path,

    arduino: siArduino.path,
    graphql: siGraphql.path,
    kotlin: siKotlin.path,
    less: siLess.path,
    lua: siLua.path,
    markdown: siMarkdown.path,
    perl: siPerl.path,
    r: siR.path,
    ruby: siRuby.path,
    scss: siSass.path,
    swift: siSwift.path,
    wasm: siWebassembly.path,
    xml: siXml.path,
    php: siPhp.path,
    javascript: siJavascript.path,
    typescript: siTypescript.path,
    python: siPython.path,
    rust: siRust.path,
    go: siGo.path,
    c: siC.path,
    cpp: siCplusplus.path,
    html: siHtml5.path,
    css: siCss.path,
    bash: siGnubash.path,
    json: siJson.path,
    yaml: siYaml.path,
};

const neutralIconPaths: Record<string, string> = {
    properties:
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h5',
    dns: 'M12 3v6M4 15v-4h16v4M9 3h6v6H9ZM1 15h6v6H1Zm8 0h6v6H9Zm8 0h6v6h-6Z',
    thrift: 'M8 3H4v18h4m8-18h4v18h-4M10 8l-3 4 3 4m4-8 3 4-3 4',
    xquery: 'M8 3H4v18h4m8-18h4v18h-4M10 8l-3 4 3 4m4-8 3 4-3 4',
    processing:
        'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a5 5 0 0 0 5-5c0-3-4-5-9-5ZM7 9h.01M10 6h.01M15 6h.01M6 14h.01',

    applescript:
        'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 4 3 3-3 3m6 0h4',
    asciidoc:
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h5',
    gherkin: 'm3 6 2 2 4-4m-6 9 2 2 4-4m-6 9 2 2 4-4M13 6h8m-8 7h8m-8 7h8',
    sas: 'M4 3v18h17M8 17v-5m5 5V7m5 10V4',
    stata: 'M4 3v18h17M8 17v-5m5 5V7m5 10V4',

    awk: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 4 3 3-3 3m6 0h4',
    glsl: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
    twig: 'M8 3H4v18h4m8-18h4v18h-4M10 8l-3 4 3 4m4-8 3 4-3 4',
    verilog:
        'M6 6h12v12H6ZM9 9h6v6H9ZM9 3v3m6-3v3m3 3h3m-3 6h3M9 18v3m6-3v3M3 9h3m-3 6h3',
    vhdl: 'M6 6h12v12H6ZM9 9h6v6H9ZM9 3v3m6-3v3m3 3h3m-3 6h3M9 18v3m6-3v3M3 9h3m-3 6h3',

    http: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z',
    protobuf: 'M8 3H4v18h4m8-18h4v18h-4M10 8l-3 4 3 4m4-8 3 4-3 4',
    dos: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 4 3 3-3 3m6 0h4',
    x86asm: 'M6 6h12v12H6ZM9 9h6v6H9ZM9 3v3m6-3v3m3 3h3m-3 6h3M9 18v3m6-3v3M3 9h3m-3 6h3',
    armasm: 'M6 6h12v12H6ZM9 9h6v6H9ZM9 3v3m6-3v3m3 3h3m-3 6h3M9 18v3m6-3v3M3 9h3m-3 6h3',

    powershell:
        'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 4 3 3-3 3m6 0h4',
    diff: 'M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M16 3v8m-4-4h8M7 16h6',
    makefile:
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h5',
    sql: 'M20 6c0 2-3.6 3-8 3S4 8 4 6s3.6-3 8-3 8 1 8 3ZM4 6v12c0 2 3.6 3 8 3s8-1 8-3V6M4 12c0 2 3.6 3 8 3s8-1 8-3',
};

export function codeLanguageIconPath(language: string): string | undefined {
    const name = normalizeCodeLanguage(language);
    return deviconLanguagePaths[name] ?? iconPaths[name];
}

export function codeLanguageIconDetails(language: string) {
    const name = normalizeCodeLanguage(language);
    const logoPath = codeLanguageIconPath(name);
    return {
        viewBox: deviconLanguagePaths[name] ? '0 0 128 128' : '0 0 24 24',
        path:
            logoPath ??
            neutralIconPaths[name] ??
            'm18 16 4-4-4-4M6 8l-4 4 4 4m8.5-12-5 16',
        outlined: !logoPath,
    };
}

export function createCodeLanguageIcon(
    language: string,
    size = 24,
): SVGSVGElement {
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('width', String(size));
    icon.setAttribute('height', String(size));
    const details = codeLanguageIconDetails(language);
    icon.setAttribute('viewBox', details.viewBox);
    icon.setAttribute('aria-hidden', 'true');
    icon.style.flexShrink = '0';
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', details.path);
    icon.setAttribute('fill', details.outlined ? 'none' : 'currentColor');
    if (details.outlined) {
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '1.8');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
    }
    icon.append(path);
    return icon;
}
