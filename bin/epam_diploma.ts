#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { EpamDiplomaStack } from '../lib/epam_diploma-stack';

const app = new cdk.App();
new EpamDiplomaStack(app, 'EpamDiplomaStack');
