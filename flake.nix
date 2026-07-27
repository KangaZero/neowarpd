{
  description = "neomouse — Vim-motion mouse control daemon for macOS";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { self, nixpkgs }:
    let
      version = "0.0.1";

      # Both Mac families. The release tarball is a UNIVERSAL binary (arm64 +
      # x86_64), so every system fetches the *same* artifact with the *same*
      # hash — no per-system url/hash split needed.
      #
      # Everything here is darwin-only on purpose: neomouse builds only on
      # macOS, and exposing Linux outputs would make `nix flake check
      # --all-systems` (run on the macOS CI runner) try to build them and fail.
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      mkNeomouse =
        pkgs:
        pkgs.stdenvNoCC.mkDerivation (finalAttrs: {
          pname = "neomouse";
          inherit version;

          # Wraps the pre-built, ad-hoc-signed release binary so users don't
          # need a Swift toolchain or Xcode. `finalAttrs.version` drives the
          # url and the changelog link, so a bump only touches `version` +
          # `hash` — `scripts/release.sh` rewrites both each release. The
          # "-macos-universal" tarball runs on both arm64 + x86_64.
          src = pkgs.fetchurl {
            url = "https://github.com/KangaZero/neomouse/releases/download/v${finalAttrs.version}/neomouse-v${finalAttrs.version}-macos-universal.tar.gz";
            # Placeholder until the v${version} release is published;
            # scripts/release.sh (and release.yml) rewrite this to the real
            # hash. `nix flake check` only *evaluates* the derivation, so this
            # stays green pre-release — a full `nix build` needs the tarball.
            hash = nixpkgs.lib.fakeHash;
          };

          # The tarball expands to `neomouse.app/` at the root (Contents/
          # Info.plist, Contents/MacOS/neomouse).
          sourceRoot = ".";

          # SwiftUI's MenuBarExtra status item only registers when
          # LaunchServices can read CFBundleIdentifier from a .app/Contents/
          # Info.plist — a bare-binary install won't show the menu-bar icon.
          # So we install the whole .app under $out/Applications/ and symlink
          # the inner binary into $out/bin/ so `neomouse` is on PATH. The man
          # page comes from the flake source (`self`), independent of the
          # release tarball, so `man neomouse` works on the Nix install path.
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/Applications"
            cp -R neomouse.app "$out/Applications/"
            mkdir -p "$out/bin"
            ln -s "$out/Applications/neomouse.app/Contents/MacOS/neomouse" "$out/bin/neomouse"
            install -Dm444 ${self}/man/neomouse.1 "$out/share/man/man1/neomouse.1"
            runHook postInstall
          '';

          meta = {
            description = "Vim-motion mouse control daemon for macOS";
            homepage = "https://github.com/KangaZero/neomouse";
            changelog = "https://github.com/KangaZero/neomouse/releases/tag/v${finalAttrs.version}";
            license = pkgs.lib.licenses.gpl3Only;
            platforms = pkgs.lib.platforms.darwin;
            mainProgram = "neomouse";
          };
        });

      # Auxiliary dev tooling NOT provided by the Xcode/Swift toolchain. `swift`
      # itself (build / test / format) comes from Xcode or swiftly — see README.
      devTools =
        pkgs: with pkgs; [
          just
          taplo
          shellcheck
          actionlint
          nixfmt-rfc-style
          statix
          deadnix
        ];
    in
    {
      packages = forAllSystems (pkgs: {
        default = mkNeomouse pkgs;
      });

      apps = forAllSystems (pkgs: {
        default = {
          type = "app";
          program = "${mkNeomouse pkgs}/bin/neomouse";
        };
      });

      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = devTools pkgs;
          # Auto-activate the repo's git hooks on shell entry (idempotent), so
          # `direnv allow` / `nix develop` is all a contributor needs — no
          # separate `scripts/setup-hooks.sh` step. Swift itself is not in this
          # shell; it comes from Xcode / swiftly.
          shellHook = ''
            if [ "$(git config --get core.hooksPath 2>/dev/null)" != ".githooks" ]; then
              git config core.hooksPath .githooks 2>/dev/null || true
            fi
            echo "neomouse dev shell — aux tooling ready (just, taplo, shellcheck, actionlint, nixfmt, statix, deadnix)."
            echo "Swift toolchain comes from Xcode/swiftly, not this shell. Run 'just' for recipes."
          '';
        };
      });

      formatter = forAllSystems (pkgs: pkgs.nixfmt-rfc-style);

      checks = forAllSystems (pkgs: {
        # Pure, tarball-free gate: assert flake.nix stays nixfmt-formatted.
        nixfmt = pkgs.runCommand "nixfmt-check" { nativeBuildInputs = [ pkgs.nixfmt-rfc-style ]; } ''
          nixfmt --check ${self}/flake.nix
          touch "$out"
        '';
      });
    };
}
