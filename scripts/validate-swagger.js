#!/usr/bin/env node

/**
 * Swagger Documentation Validator
 * 
 * This script validates the Swagger/OpenAPI documentation
 * and provides helpful information about documented endpoints.
 */

const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Omade Cravings API',
      version: '1.0.0',
      description: 'Food delivery and restaurant management platform API',
    },
  },
  apis: [
    './src/domains/*/routes/*.ts',
    './src/domains/*/controllers/*.ts',
    './src/app.ts',
  ],
};

function findRouteFiles() {
  const routeFiles = [];
  const domainsPath = path.join(__dirname, '../src/domains');
  
  if (!fs.existsSync(domainsPath)) {
    console.warn('⚠️  Domains directory not found');
    return [];
  }
  
  const domains = fs.readdirSync(domainsPath);
  
  domains.forEach(domain => {
    const routesPath = path.join(domainsPath, domain, 'routes');
    if (fs.existsSync(routesPath)) {
      const routeFiles_domain = fs.readdirSync(routesPath)
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(routesPath, file));
      routeFiles.push(...routeFiles_domain);
    }
  });
  
  return routeFiles;
}

function analyzeDocumentation() {
  console.log('🔍 Analyzing API Documentation...\n');
  
  try {
    const swaggerSpec = swaggerJSDoc(swaggerOptions);
    
    console.log('✅ Swagger configuration is valid!');
    console.log(`📊 Found ${Object.keys(swaggerSpec.paths || {}).length} documented endpoints`);
    console.log(`🏷️  Found ${Object.keys(swaggerSpec.components?.schemas || {}).length} schema definitions`);
    console.log(`🎯 Found ${swaggerSpec.tags?.length || 0} endpoint categories\n`);
    
    // List documented endpoints by tag
    if (swaggerSpec.paths) {
      const endpointsByTag = {};
      
      Object.keys(swaggerSpec.paths).forEach(path => {
        const methods = Object.keys(swaggerSpec.paths[path]);
        methods.forEach(method => {
          const endpoint = swaggerSpec.paths[path][method];
          const tag = endpoint.tags?.[0] || 'Untagged';
          
          if (!endpointsByTag[tag]) {
            endpointsByTag[tag] = [];
          }
          
          endpointsByTag[tag].push({
            method: method.toUpperCase(),
            path: path,
            summary: endpoint.summary || 'No summary',
            description: endpoint.description || ''
          });
        });
      });
      
      console.log('📋 Documented endpoints by category:\n');
      Object.keys(endpointsByTag).sort().forEach(tag => {
        console.log(`  📁 ${tag}:`);
        endpointsByTag[tag].forEach(endpoint => {
          const authRequired = endpoint.method !== 'GET' || endpoint.path.includes('/me') || endpoint.path.includes('/admin');
          const authIcon = authRequired ? '🔐' : '🌐';
          console.log(`     ${authIcon} ${endpoint.method.padEnd(6)} ${endpoint.path}`);
          console.log(`        └─ ${endpoint.summary}`);
        });
        console.log('');
      });
    }
    
    // Find undocumented routes
    console.log('🔍 Checking for undocumented routes...\n');
    const routeFiles = findRouteFiles();
    const undocumentedRoutes = [];
    
    routeFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const routerCalls = content.match(/router\.(get|post|put|patch|delete)\s*\(/g) || [];
        const swaggerDocs = content.match(/@swagger/g) || [];
        
        if (routerCalls.length > swaggerDocs.length) {
          const relativePath = path.relative(process.cwd(), file);
          undocumentedRoutes.push({
            file: relativePath,
            routerCalls: routerCalls.length,
            documented: swaggerDocs.length,
            missing: routerCalls.length - swaggerDocs.length
          });
        }
      } catch (error) {
        console.warn(`⚠️  Could not analyze ${file}: ${error.message}`);
      }
    });
    
    if (undocumentedRoutes.length > 0) {
      console.log('⚠️  Found potentially undocumented routes:\n');
      undocumentedRoutes.forEach(route => {
        console.log(`  📄 ${route.file}:`);
        console.log(`     🔵 ${route.routerCalls} router calls, ${route.documented} documented (${route.missing} missing)`);
      });
      console.log('');
    } else {
      console.log('✅ All route files appear to be documented!\n');
    }
    
    console.log('🎉 Documentation analysis complete!');
    console.log('   📚 Access docs at: http://localhost:3000/api/docs');
    console.log('   📖 Read guide at: docs/api-documentation.md');
    
  } catch (error) {
    console.error('❌ Swagger configuration error:', error.message);
    console.error('\nDebug info:');
    console.error('  Current directory:', process.cwd());
    console.error('  API paths:', swaggerOptions.apis);
    process.exit(1);
  }
}

// Run analysis
analyzeDocumentation();