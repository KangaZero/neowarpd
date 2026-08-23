{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    # Support a particular subset of the Nix systems
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
              # statix.enable = true;
              # deadnix.enable = true;

              just-hook = {
                enable = true;
                name = "just hook";
                entry = "${pkgs.writeShellScriptBin "just-hook" ''
                                    IDK why but adding pkgs.swift and even after removal will point these 2 env variables to the nix store... even after a rebuild it still remains
                                    unset SDKROOT
                                    unset DEVELOPER_DIR
                  		  just check
                ''}/bin/just-hook";
                # entry = "${pkgs.writeShellScriptBin "just-hook" ''
                #   just review-count
                #   # Nudge only (never blocks the commit): remind to refresh the
                #   # README image when UI files are staged. Screenshot stays a
                #   # manual `just screenshot` so PNG blobs don't bloat git history.
                #   if git diff --cached --name-only | grep -qE '^(app|components)/'; then
                #     echo "note: UI files staged - refresh the README image with: just screenshot"
                #   fi
                # ''}/bin/just-hook";
                language = "system";
                pass_filenames = false;
                always_run = true;
                stages = [ "pre-commit" ];
              };
              #
              # Pre-push guard: reject any incoming commit whose author OR
              # committer is not the personal identity. Keeps work identity out
              # of this repo's history for good.
              # TODO If there eventually will be more than a single person import email dynamically
              check-author = {
                enable = true;
                name = "check git author";
                # writeShellScriptBin puts the binary at $out/bin/<name>, so the
                # entry must suffix /bin/check-author (the drv alone is $out).
                entry = "${pkgs.writeShellScriptBin "check-author" ''
                  expected="samuelyongw@gmail.com"
                  zero="0000000000000000000000000000000000000000"
                  while IFS=' ' read -r _local_ref local_sha _remote_ref remote_sha; do
                    # Skip branch deletions.
                    [ "$local_sha" = "$zero" ] && continue

                    # Isolate only the new incoming commits.
                    if [ "$remote_sha" = "$zero" ]; then
                      commits=$(git rev-list "$local_sha" --not --remotes 2>/dev/null)
                    else
                      commits=$(git rev-list "$remote_sha..$local_sha" 2>/dev/null)
                    fi

                    [ -z "$commits" ] && continue

                    while IFS= read -r commit; do
                      IFS='|' read -r author_email committer_email <<< "$(git log -1 --format="%ae|%ce" "$commit" 2>/dev/null)"

                      if [ "$author_email" != "$expected" ]; then
                        echo "Push rejected: $commit not authored by KangaZero <$expected> (got: $author_email)"
                        exit 1
                      fi
                      if [ "$committer_email" != "$expected" ]; then
                        echo "Push rejected: $commit not committed by KangaZero <$expected> (got: $committer_email)"
                        exit 1
                      fi
                    done <<< "$commits"
                  done
                ''}/bin/check-author";
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
            # shellHook = installs the git pre-commit hook defined above.
            inherit (self.checks.${system}.pre-commit-check) shellHook;

            packages = [
              pkgs.taplo
              pkgs.just
              # swift-driver version: 1.148.6 Apple Swift version 6.3.3 (swiftlang-6.3.3.1.3 clang-2100.1.1.101)
              # Target: arm64-apple-macosx26.0
            ]
            ++ self.checks.${system}.pre-commit-check.enabledPackages;
          };
        }
      );
    };
}
