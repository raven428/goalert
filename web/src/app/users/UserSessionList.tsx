import React, { useState } from 'react'
import FlatList from '../lists/FlatList'
import { useSessionInfo } from '../util/RequireConfig'
import gql from 'graphql-tag'
import { useMutation, useQuery } from 'react-apollo'
import { Button, Card, IconButton, makeStyles } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { UserSession } from '../../schema'
import Bowser from 'bowser'
import { formatTimeSince } from '../util/timeFormat'
import _ from 'lodash-es'
import PageActions from '../util/PageActions'
import FormDialog from '../dialogs/FormDialog'
import { nonFieldErrors } from '../util/errutil'
import { ApolloError } from 'apollo-client'

const query = gql`
  query($userID: ID!) {
    user(id: $userID) {
      id
      sessions {
        id
        userAgent
        current
        createdAt
        lastAccessAt
      }
    }
  }
`

const mutationLogoutOne = gql`
  mutation($input: [TargetInput!]) {
    deleteAll(input: $input)
  }
`

const mutationLogoutAll = gql`
  mutation {
    endAllAuthSessionsByCurrentUser
  }
`

const useStyles = makeStyles({
  button: {
    width: '270px',
  },
})

export interface UserSessionListProps {
  userID?: string
}

function friendlyUAString(ua: string): string {
  const b = Bowser.getParser(ua)

  return `${b.getBrowserName()} ${
    b.getBrowserVersion().split('.')[0]
  } on ${b.getOSName()} (${b.getPlatformType()})`
}

type Session = {
  id: string
  userAgent: string
}

export default function UserSessionList(
  props: UserSessionListProps,
): JSX.Element {
  const classes = useStyles()

  // handles both logout all and logout individual sessions
  const [showDialog, setShowDialog] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  const { userID: curUserID } = useSessionInfo()
  const userID = props.userID || curUserID
  const { data } = useQuery(query, { variables: { userID } })

  const sessions: UserSession[] = _.sortBy(
    data?.user?.sessions || [],
    (s: UserSession) => (s.current ? '_' + s.lastAccessAt : s.lastAccessAt),
  )

  const [logoutOne, logoutOneStatus] = useMutation(mutationLogoutOne, {
    onCompleted: () => setShowDialog(false),
  })
  const [logoutAll, logoutAllStatus] = useMutation(mutationLogoutAll, {
    onCompleted: () => setShowDialog(false),
  })

  function getSubtitle(): string {
    if (session?.id) {
      return `This will log you out of your "${friendlyUAString(
        session.userAgent,
      )}" session.`
    }

    return 'This will log you out of all other sessions.'
  }

  return (
    <React.Fragment>
      <PageActions>
        <Button
          color='inherit'
          onClick={() => setShowDialog(true)}
          className={classes.button}
        >
          Log Out Other Sessions
        </Button>
      </PageActions>

      <Card>
        <FlatList
          items={sessions.map((s) => ({
            title: friendlyUAString(s.userAgent),
            highlight: s.current,
            secondaryAction: s.current ? null : (
              <IconButton
                color='primary'
                onClick={() => {
                  setShowDialog(true)
                  setSession({
                    id: s.id,
                    userAgent: s.userAgent,
                  })
                }}
              >
                <DeleteIcon />
              </IconButton>
            ),
            subText: `Last access: ${formatTimeSince(s.lastAccessAt)}`,
          }))}
        />
      </Card>

      {showDialog && (
        <FormDialog
          title='Are you sure?'
          confirm
          loading={logoutOneStatus.loading || logoutAllStatus.loading}
          errors={nonFieldErrors(
            (logoutOneStatus.error || logoutAllStatus.error) as ApolloError,
          )}
          subTitle={getSubtitle()}
          onSubmit={() =>
            session?.id
              ? logoutOne({
                  variables: {
                    input: [
                      {
                        id: session?.id,
                        type: 'userSession',
                      },
                    ],
                  },
                })
              : logoutAll()
          }
          onClose={() => setShowDialog(false)}
        />
      )}
    </React.Fragment>
  )
}
