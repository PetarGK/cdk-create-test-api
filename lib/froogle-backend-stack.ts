import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import apigateway = require('@aws-cdk/aws-apigateway'); 
import {AuthorizationType} from "@aws-cdk/aws-apigateway";
import cognito = require("@aws-cdk/aws-cognito");
import {SignInType, UserPool, UserPoolAttribute} from "@aws-cdk/aws-cognito";
import iam = require("@aws-cdk/aws-iam");
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { Duration } from '@aws-cdk/core';

export class FroogleBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizationHeaderName = "Authorization";

    const userPool: UserPool = new cognito.UserPool(this, id + "Pool", {
      signInType: SignInType.EMAIL,
      autoVerifiedAttributes: [UserPoolAttribute.EMAIL],
    });
    const userPoolClient = new cognito.UserPoolClient(this, 'WebUserPoolClient', {
      generateSecret: false,
      userPool: userPool,
      userPoolClientName: 'WebUserPoolClient'
    });    
    const identityPool = new cognito.CfnIdentityPool(this, id + 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [{
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
      }]
    });
    const unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
        }, "sts:AssumeRoleWithWebIdentity"),
    });
    unauthenticatedRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*"
        ],
        resources: ["*"],
    }));
    const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
        assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
            "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
            "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
        }, "sts:AssumeRoleWithWebIdentity"),
    });
    authenticatedRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            "mobileanalytics:PutEvents",
            "cognito-sync:*",
            "cognito-identity:*"
        ],
        resources: ["*"],
    }));
    new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
        identityPoolId: identityPool.ref,
        roles: {
            'unauthenticated': unauthenticatedRole.roleArn,
            'authenticated': authenticatedRole.roleArn
        }
    });    

    const api = new apigateway.RestApi(this, 'itemsApi', {
      restApiName: 'Items Service',
      domainName: {
        domainName: 'webapi.petarkorudzhiev.com',
        certificate: Certificate.fromCertificateArn(this, "certificate", "arn:aws:acm:us-east-1:271522064567:certificate/c0bc9d4e-e6e5-4411-ba05-4f33d13d7fd1"),
      },
    });

    const getOneLambda = new lambda.Function(this, 'getOneItemFunction', {
      code: new lambda.AssetCode('dist/src/get-one'),
      handler: 'main.handler',
      runtime: lambda.Runtime.NODEJS_8_10,
    }); 
    const cfnAuthorizer = new apigateway.CfnAuthorizer(this, id, {
      name: "CognitoAuthorizer",
      type: AuthorizationType.COGNITO,

      identitySource: "method.request.header." + authorizationHeaderName,
      restApiId: api.restApiId,
      providerArns: [userPool.userPoolArn]
    });      

    const getAllLambda = new lambda.Function(this, 'getAllItemsFunction', {
      code: new lambda.AssetCode('dist/src/get-all'),
      handler: 'main.handler',
      runtime: lambda.Runtime.NODEJS_8_10,
      timeout: Duration.seconds(30)
    });

    /*
    getAllLambda.addToRolePolicy(new PolicyStatement({
      actions: ["dynamodb:CreateTable"],
      resources: ["arn:aws:dynamodb:us-east-1:271522064567:table/offers"]
    }));*/

    /*
    getAllLambda.addToRolePolicy(new PolicyStatement({
      actions: ["dynamodb:PutItem"],
      resources: ["arn:aws:dynamodb:us-east-1:271522064567:table/offers"] 
    }));*/

    getAllLambda.addToRolePolicy(new PolicyStatement({
      actions: ["*"],
      resources: ["arn:aws:dynamodb:us-east-1:271522064567:table/offers"] 
    }));

    const v1 = api.root.addResource('v1');

    const items = v1.addResource('items');
    const getAllIntegration = new apigateway.LambdaIntegration(getAllLambda);
    const allMethod = items.addMethod('GET', getAllIntegration, {
      apiKeyRequired: true 
    });

    const singleItem = items.addResource('{id}');
    const getOneIntegration = new apigateway.LambdaIntegration(getOneLambda);
    singleItem.addMethod('GET', getOneIntegration, {
      authorizer: {authorizerId: cfnAuthorizer.ref},
      authorizationType: AuthorizationType.COGNITO,
    });  

    const key = api.addApiKey('ApiKey');
    const plan = api.addUsagePlan('UsagePlan', {
      name: 'Easy',
      apiKey: key,
      throttle: {
        rateLimit: 10,
        burstLimit: 2
      }
    });
    
    plan.addApiStage({
      stage: api.deploymentStage,
      throttle: [
        {
          method: allMethod,
          throttle: {
            rateLimit: 10,
            burstLimit: 2
          }
        }              
      ]
    });    
  }
}
