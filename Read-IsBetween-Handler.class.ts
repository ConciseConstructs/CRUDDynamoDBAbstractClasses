import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    lowerBounds:any
    upperBounds:any
    indexName?:string
    view?:any
    lastEvaluatedKey?:any
}


export abstract class ReadIsBetweenHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse
    protected syntax


    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId', 'lowerBounds', 'upperBounds']
          this.needsToConnectToDatabase = true
        }




    protected performActions() {
      this.makeInitialSyntax()
      if (this.request.indexName) this.addQueryByIndexSyntax()
      if (this.request.view) this.addProjectionSyntax()
      if (this.request.lastEvaluatedKey) this.addLastEvaluatedKeySyntax()
      this.performQuery()
    }




        protected makeInitialSyntax() {
          this.syntax = {
            TableName : `${ process.env.saasName }-${ process.env.stage }`,
            KeyConditionExpression: '#table = :table AND #index BETWEEN :lowerBounds and :upperBounds',
            ExpressionAttributeNames:{
                "#table": 'table',
                "#index": this.request.indexName || 'id'
            },
            ExpressionAttributeValues: {
              ":table": `${ this.request.accountId }.${ process.env.model }`,
            },
          }
          if (this.request.indexName) {
            this.syntax.ExpressionAttributeValues[":lowerBounds"] = `${ process.env[this.request.indexName] }:${ this.request.lowerBounds }`
            this.syntax.ExpressionAttributeValues[":upperBounds"] = `${ process.env[this.request.indexName] }:${ this.request.upperBounds }`
          }
          else {
            this.syntax.ExpressionAttributeValues[":lowerBounds"] = this.request.lowerBounds
            this.syntax.ExpressionAttributeValues[":upperBounds"] = this.request.upperBounds
          }
        }




        protected addQueryByIndexSyntax() {
          this.syntax.IndexName = this.request.indexName
        }




        protected addProjectionSyntax() {
          this.request.view = JSON.parse(this.request.view)
          this.syntax.ProjectionExpression = this.request.view.ProjectionExpression
          for (let [ placeholder, value ] of Object.entries(this.request.view.ExpressionAttributeNames) as any) {
            this.syntax.ExpressionAttributeNames[placeholder] = value
          }
        }




        protected addLastEvaluatedKeySyntax() {
          this.syntax.ExclusiveStartKey = JSON.parse(this.request.lastEvaluatedKey)
        }




        protected performQuery() {
          this.db.query(this.syntax).promise()
            .then(result => this.hasSucceeded(result))
            .catch(error => this.hasFailed(error))
        }

} // End Main Handler Function -------
