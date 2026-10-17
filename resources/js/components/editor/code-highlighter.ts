import ada from 'highlight.js/lib/languages/ada';
import apache from 'highlight.js/lib/languages/apache';
import applescript from 'highlight.js/lib/languages/applescript';
import armasm from 'highlight.js/lib/languages/armasm';
import asciidoc from 'highlight.js/lib/languages/asciidoc';
import autohotkey from 'highlight.js/lib/languages/autohotkey';
import autoit from 'highlight.js/lib/languages/autoit';
import awk from 'highlight.js/lib/languages/awk';
import clojure from 'highlight.js/lib/languages/clojure';
import cmake from 'highlight.js/lib/languages/cmake';
import coffeescript from 'highlight.js/lib/languages/coffeescript';
import coq from 'highlight.js/lib/languages/coq';
import crystal from 'highlight.js/lib/languages/crystal';
import d from 'highlight.js/lib/languages/d';
import dart from 'highlight.js/lib/languages/dart';
import delphi from 'highlight.js/lib/languages/delphi';
import dns from 'highlight.js/lib/languages/dns';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import dos from 'highlight.js/lib/languages/dos';
import elixir from 'highlight.js/lib/languages/elixir';
import elm from 'highlight.js/lib/languages/elm';
import erlang from 'highlight.js/lib/languages/erlang';
import fortran from 'highlight.js/lib/languages/fortran';
import fsharp from 'highlight.js/lib/languages/fsharp';
import gherkin from 'highlight.js/lib/languages/gherkin';
import glsl from 'highlight.js/lib/languages/glsl';
import gradle from 'highlight.js/lib/languages/gradle';
import groovy from 'highlight.js/lib/languages/groovy';
import handlebars from 'highlight.js/lib/languages/handlebars';
import haskell from 'highlight.js/lib/languages/haskell';
import haxe from 'highlight.js/lib/languages/haxe';
import http from 'highlight.js/lib/languages/http';
import ini from 'highlight.js/lib/languages/ini';
import julia from 'highlight.js/lib/languages/julia';
import latex from 'highlight.js/lib/languages/latex';
import lisp from 'highlight.js/lib/languages/lisp';
import llvm from 'highlight.js/lib/languages/llvm';
import matlab from 'highlight.js/lib/languages/matlab';
import nginx from 'highlight.js/lib/languages/nginx';
import nim from 'highlight.js/lib/languages/nim';
import nix from 'highlight.js/lib/languages/nix';
import ocaml from 'highlight.js/lib/languages/ocaml';
import openscad from 'highlight.js/lib/languages/openscad';
import pgsql from 'highlight.js/lib/languages/pgsql';
import powershell from 'highlight.js/lib/languages/powershell';
import processing from 'highlight.js/lib/languages/processing';
import prolog from 'highlight.js/lib/languages/prolog';
import properties from 'highlight.js/lib/languages/properties';
import protobuf from 'highlight.js/lib/languages/protobuf';
import qml from 'highlight.js/lib/languages/qml';
import reasonml from 'highlight.js/lib/languages/reasonml';
import sas from 'highlight.js/lib/languages/sas';
import scala from 'highlight.js/lib/languages/scala';
import scheme from 'highlight.js/lib/languages/scheme';
import smalltalk from 'highlight.js/lib/languages/smalltalk';
import stata from 'highlight.js/lib/languages/stata';
import stylus from 'highlight.js/lib/languages/stylus';
import tcl from 'highlight.js/lib/languages/tcl';
import thrift from 'highlight.js/lib/languages/thrift';
import twig from 'highlight.js/lib/languages/twig';
import vala from 'highlight.js/lib/languages/vala';
import vbscript from 'highlight.js/lib/languages/vbscript';
import verilog from 'highlight.js/lib/languages/verilog';
import vhdl from 'highlight.js/lib/languages/vhdl';
import vim from 'highlight.js/lib/languages/vim';
import x86asm from 'highlight.js/lib/languages/x86asm';
import xquery from 'highlight.js/lib/languages/xquery';
import { common, createLowlight } from 'lowlight';

export function createCodeHighlighter() {
    const highlighter = createLowlight({
        ...common,
        ada,
        apache,
        applescript,
        armasm,
        asciidoc,
        autohotkey,
        autoit,
        awk,
        clojure,
        cmake,
        coffeescript,
        coq,
        crystal,
        d,
        dart,
        delphi,
        dns,
        dockerfile,
        dos,
        elixir,
        elm,
        erlang,
        fortran,
        fsharp,
        gherkin,
        glsl,
        gradle,
        groovy,
        handlebars,
        haskell,
        haxe,
        http,
        julia,
        latex,
        lisp,
        llvm,
        matlab,
        nginx,
        nim,
        nix,
        ocaml,
        openscad,
        pgsql,
        powershell,
        processing,
        prolog,
        properties,
        protobuf,
        qml,
        reasonml,
        sas,
        scala,
        scheme,
        smalltalk,
        stata,
        stylus,
        tcl,
        thrift,
        twig,
        vala,
        vbscript,
        verilog,
        vhdl,
        vim,
        x86asm,
        xquery,
        toml: ini,
    });
    highlighter.registerAlias({ bash: ['git'] });
    return highlighter;
}
