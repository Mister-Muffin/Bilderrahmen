{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }: 
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems f;
    in
    {
      devShells = forAllSystems (system: 
        let 
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShellNoCC {
            shellHook = "echo hello";

            packages = with pkgs; [
              deno
            ];
          };
        }
      );

      apps = forAllSystems (system: 
        let 
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          deno = {
            type = "app";
            program = "${pkgs.deno}/bin/deno";
          };
        }
      );
    };
}
