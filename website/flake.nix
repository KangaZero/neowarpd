# SPDX-License-Identifier: GPL-3.0-only
# [!IMPORTANT] Human review needed — AI-generated, unreviewed. See AI_POLICY.md.
#
# Isolated dev environment for the neomouse marketing/docs website (Vue + Vite).
# Deliberately self-contained: it shares nothing with the Swift daemon's flake at
# the repo root, so the website toolchain can move independently of the program.
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    systems = {
      url = "github:nix-systems/default";
    };

    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      systems,
      ...
    }@inputs:
    let
      forEachSystem =
        f: nixpkgs.lib.genAttrs (import systems) (system: f system nixpkgs.legacyPackages.${system});
    in
    {
      checks = forEachSystem (
        system: pkgs: {
          pre-commit-check = inputs.git-hooks.lib.${system}.run {
            src = ./.;
            hooks = {
              # Nix hygiene.
              nixfmt.enable = true;
              statix.enable = true;
              deadnix.enable = true;

              # Single source of truth: run the project-pinned Biome from
              # node_modules so the hook, CI, and `just` all execute the same
              # binary (matches @biomejs/biome in package.json).
              biome = {
                enable = true;
                settings.binPath = "./node_modules/.bin/biome";
              };

              # Pre-push type gate: mirror `just typecheck` (vue-tsc project build)
              # so a clean checkout can't slip type errors past `git push`.
              typecheck = {
                enable = true;
                name = "typecheck";
                entry = "${pkgs.writeShellScriptBin "typecheck-hook" ''
                  just typecheck
                ''}/bin/typecheck-hook";
                language = "system";
                pass_filenames = false;
                always_run = true;
                stages = [ "pre-push" ];
              };
            };
          };
        }
      );

      devShells = forEachSystem (
        system: pkgs: {
          default = pkgs.mkShell {
            inherit (self.checks.${system}.pre-commit-check) shellHook;

            packages = [
              # Node 26 (Current) — matches the GitHub Pages workflow.
              # TypeScript comes from node_modules (native TS7), so no
              # nix-provided typescript here — same single-binary rule as Biome.
              pkgs.nodejs_26
              pkgs.pnpm
              pkgs.just
              # pandoc regenerates ../man/neomouse.1 from docs Markdown
              # (`just gen-man`). Isolated to this shell so the daemon build
              # never grows a pandoc dependency.
              pkgs.pandoc
            ]
            ++ self.checks.${system}.pre-commit-check.enabledPackages;
          };
        }
      );
    };
}
