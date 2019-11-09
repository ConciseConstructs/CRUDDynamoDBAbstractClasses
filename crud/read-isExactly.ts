import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    indexName:string
    value:any
  }


export abstract class HandlerObject extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = []
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      this.db.query(this.makeIsExactlySyntax()).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        private makeIsExactlySyntax() {
          return {
            TableName : `${ process.env.saasName }-${ process.env.stage }`,
            IndexName: this.request.indexName,
            KeyConditionExpression: '#p = :x AND #i = :v',
            ExpressionAttributeNames:{
                "#p": 'table',
                "#i": this.request.indexName
            },
            ExpressionAttributeValues: {
                ":x": `${ this.request.accountId }.${ process.env.model }`,
                ":v": `${ process.env.indexA }:${ this.request.value }`
            }
          }
        }

} // End Main Handler Function -------
