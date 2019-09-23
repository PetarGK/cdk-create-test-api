import { Construct } from "@aws-cdk/core";

import { FroogleBackendStack } from '../lib/froogle-backend-stack';
import { FroogleDynamoDbStack } from '../lib/froogle-dynamodb-stack';
import { FroogleMonitoringStack } from '../lib/froogle-monitoring-stack';

export interface WebApiProps {
    
}

export class WebApi extends Construct {
    constructor(scope: Construct, id: string, props: WebApiProps = {}) {
      super(scope, id);

      new FroogleBackendStack(this, 'FroogleBackendStack');
      new FroogleDynamoDbStack(this, 'FroogleDynamoDbStack');
      new FroogleMonitoringStack(this, 'FroogleMonitoringStack');
    }
}