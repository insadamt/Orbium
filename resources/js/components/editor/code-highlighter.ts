import clojure from 'highlight.js/lib/languages/clojure';
import cmake from 'highlight.js/lib/languages/cmake';
import dart from 'highlight.js/lib/languages/dart';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import elixir from 'highlight.js/lib/languages/elixir';
import erlang from 'highlight.js/lib/languages/erlang';
import fortran from 'highlight.js/lib/languages/fortran';
import fsharp from 'highlight.js/lib/languages/fsharp';
import groovy from 'highlight.js/lib/languages/groovy';
import haskell from 'highlight.js/lib/languages/haskell';
import julia from 'highlight.js/lib/languages/julia';
import lisp from 'highlight.js/lib/languages/lisp';
import matlab from 'highlight.js/lib/languages/matlab';
import nginx from 'highlight.js/lib/languages/nginx';
import ocaml from 'highlight.js/lib/languages/ocaml';
import powershell from 'highlight.js/lib/languages/powershell';
import scala from 'highlight.js/lib/languages/scala';
import scheme from 'highlight.js/lib/languages/scheme';
import ini from 'highlight.js/lib/languages/ini';
import { common, createLowlight } from 'lowlight';

export function createCodeHighlighter() {
    return createLowlight({
        ...common,
        clojure,
        cmake,
        dart,
        dockerfile,
        elixir,
        erlang,
        fortran,
        fsharp,
        groovy,
        haskell,
        julia,
        lisp,
        matlab,
        nginx,
        ocaml,
        powershell,
        scala,
        scheme,
        toml: ini,
    });
}
