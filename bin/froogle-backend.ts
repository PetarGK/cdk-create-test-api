#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { FroogleBackendStack } from '../lib/froogle-backend-stack';

const app = new cdk.App();
new FroogleBackendStack(app, 'FroogleBackendStack');
