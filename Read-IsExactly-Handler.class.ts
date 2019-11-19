import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    value:any
    indexName?:string
  }


export abstract class ReadIsExactlyHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse
    private syntax:any


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId', 'value']
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      this.db.query(this.makeIsExactlySyntax()).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        private makeIsExactlySyntax() {
          let syntax = {
            TableName : `${ process.env.saasName }-${ process.env.stage }`,
            KeyConditionExpression: '#table = :table AND #index = :value',
            ExpressionAttributeNames:{
                "#table": 'table',
                "#index": this.request.indexName || 'id'
            },
            ExpressionAttributeValues: {
                ":table": `${ this.request.accountId }.${ process.env.model }`,
                ":value": this.request.value
            }
          }
          if (this.request.indexName) syntax.IndexName = this.request.indexName
          return syntax
        }

} // End Main Handler Function -------
