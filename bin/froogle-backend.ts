#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { WebApi } from '../constructs/web-api'

const app = new cdk.App();
new WebApi(app, "webApi", {});

