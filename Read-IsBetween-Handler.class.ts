import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    lowerBounds:any
    upperBounds:any
    indexName?:string
}


export abstract class ReadIsBetweenHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId', 'lowerBounds', 'upperBounds']
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      this.db.query(this.makeIsBetweenSyntax()).promise()
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        protected makeIsBetweenSyntax() {
          let syntax = {
            TableName : `${ process.env.saasName }-${ process.env.stage }`,
            KeyConditionExpression: '#table = :table AND #index BETWEEN :lowerBounds and :upperBounds',
            ExpressionAttributeNames:{
                "#table": 'table',
                "#index": this.request.indexName || 'id'
            },
            ExpressionAttributeValues: {
              ":table": `${ this.request.accountId }.${ process.env.model }`,
              ":lowerBounds": this.request.lowerBounds,
              ":upperBounds": this.request.upperBounds
            },
          } as any
          if (this.request.indexName) syntax.IndexName = this.request.indexName
          return syntax
        }

} // End Main Handler Function -------
