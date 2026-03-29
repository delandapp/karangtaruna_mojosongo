import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFiles = project.getSourceFiles("app/api/**/route.ts");

console.log(`Found ${sourceFiles.length} route files to process...`);

let modifications = 0;

sourceFiles.forEach((sourceFile) => {
  const filePath = sourceFile.getFilePath();
  // We only want to transform POST, PUT, DELETE functions 
  // Wait, actually, removing manual write-through cache from anywhere except GET is what we want.
  // The simplest is to find variable statements or expressions containing `setCache`, `invalidateCachePrefix`, `redis.del`
  // inside exported functions like POST, PUT, DELETE.

  const exportDecls = sourceFile.getVariableDeclarations().filter(decl => {
    const name = decl.getName();
    return name === "POST" || name === "PUT" || name === "DELETE";
  });

  if (exportDecls.length === 0) return;

  exportDecls.forEach(decl => {
    // Find CallExpressions inside these declarations
    const callExpressions = decl.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    // Reverse iterating to avoid AST offset shifts during removal!
    const cacheCalls = callExpressions.filter(call => {
      const text = call.getExpression().getText();
      return text === "setCache" || text === "invalidateCachePrefix" || text === "redis.del";
    });

    if (cacheCalls.length > 0) {
      console.log(`Modifying ${path.basename(filePath)} (${decl.getName()}) ... Removing ${cacheCalls.length} cache operations.`);
      
      // We must remove the entire statement containing the call
      const statementsToRemove = new Set(cacheCalls.map(call => call.getFirstAncestorByKind(SyntaxKind.ExpressionStatement)));
      
      Array.from(statementsToRemove).forEach(stmt => {
        if (stmt) {
          stmt.remove();
          modifications++;
        }
      });
    }
  });

  // After removing from POST/PUT/DELETE, check if `setCache` and `invalidateCachePrefix` are still used in the file
  // If not, we could remove them from the imports to keep it clean, but let's just let it be.
  sourceFile.saveSync();
});

console.log(`\nSuccess! Removed ${modifications} manual cache write operations across the API.`);
